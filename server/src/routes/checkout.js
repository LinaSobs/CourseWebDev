import { Router } from 'express'
import { config } from '../config.js'
import { query, transaction } from '../db.js'
import { httpError } from '../middleware.js'
import { stripe } from '../stripe.js'

const router = Router() // mounted behind attachUser + requireAuth: nobody can reach this without being signed in

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

// Where Stripe sends the customer back to: the website they started from (checked against the allowed list),
// otherwise the first allowed website. We never use a URL taken from the request body.
function siteUrl(req) {
  const origin = req.get('origin')
  return (origin && config.origins.includes(origin) ? origin : config.origins.find((o) => o !== config.publicUrl) ?? config.origins[0]).replace(/\/$/, '')
}

// POST /api/checkout  { name, address, country }
// 1) reads the cart and the REAL prices from our database (the browser never sends a price)
// 2) saves a 'pending' order with its lines
// 3) asks Stripe for a hosted Checkout page for exactly that order and returns its URL
router.post('/', async (req, res) => {
  if (!stripe) throw httpError(503, 'Payments are not set up on this server yet.')

  const name = clean(req.body?.name, 120)
  const address = clean(req.body?.address, 300)
  const country = clean(req.body?.country, 80)
  if (!name || !address || !country) throw httpError(400, 'Please fill in your name, address and country.')

  const order = await transaction(async (db) => {
    const { rows: lines } = await db.query(
      `select c.book_id, c.quantity, b.title, b.price_cents, b.stock
         from cart_items c join books b on b.id = c.book_id
        where c.user_id = $1 order by c.book_id`,
      [req.user.id],
    )
    if (!lines.length) throw httpError(400, 'Your cart is empty.')
    // Stock is only CHECKED here. It is taken off when the payment is confirmed (see the webhook).
    for (const l of lines) {
      if (l.stock < l.quantity) throw httpError(409, `Sorry, "${l.title}" doesn't have enough copies left.`)
    }

    const totalCents = lines.reduce((sum, l) => sum + l.price_cents * l.quantity, 0)
    const {
      rows: [created],
    } = await db.query(
      `insert into orders (user_id, total_cents, status, ship_name, ship_address, ship_country)
       values ($1, $2, 'pending', $3, $4, $5) returning id`,
      [req.user.id, totalCents, name, address, country],
    )
    for (const l of lines) {
      await db.query(
        'insert into order_items (order_id, book_id, title, unit_price_cents, quantity) values ($1,$2,$3,$4,$5)',
        [created.id, l.book_id, l.title, l.price_cents, l.quantity],
      )
    }
    return { id: created.id, totalCents, lines }
  })

  let session
  try {
    const base = siteUrl(req)
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: order.lines.map((l) => ({
          quantity: l.quantity,
          price_data: { currency: 'usd', unit_amount: l.price_cents, product_data: { name: l.title } },
        })),
        client_reference_id: String(order.id),
        customer_email: req.user.email,
        metadata: { order_id: String(order.id), user_id: req.user.id },
        success_url: `${base}/#/checkout/success?order=${order.id}`,
        cancel_url: `${base}/#/checkout/cancelled?order=${order.id}`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // the Stripe page stays valid for 30 minutes
      },
      { idempotencyKey: `order-${order.id}` }, // a double click can never create two Stripe sessions for one order
    )
    await query('update orders set stripe_session_id = $2 where id = $1', [order.id, session.id])
  } catch (err) {
    console.error('Stripe session failed:', err.message)
    await query("update orders set status = 'expired' where id = $1 and status = 'pending'", [order.id])
    throw httpError(502, 'We could not start the payment. Please try again.')
  }

  res.status(201).json({ orderId: order.id, url: session.url })
})

export default router
