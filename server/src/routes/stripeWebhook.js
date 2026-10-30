import { config } from '../config.js'
import { transaction, query } from '../db.js'
import { stripe } from '../stripe.js'

// POST /api/stripe/webhook  <- called by STRIPE's servers, not by the browser.
// This is the ONLY place in the whole project that sets an order to 'paid'.
// The browser being redirected to the success page proves nothing (anyone can type that address);
// a request carrying a valid Stripe signature proves the payment really happened.
export async function stripeWebhook(req, res) {
  if (!stripe || !config.stripeWebhookSecret) return res.status(503).send('Webhook is not configured.')

  // req.body is the RAW bytes here (see index.js). The signature is calculated over those exact bytes.
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), config.stripeWebhookSecret)
  } catch (err) {
    console.warn('Rejected webhook with a bad signature:', err.message)
    return res.status(400).send('Invalid signature.')
  }

  const session = event.data.object
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      if (session.payment_status === 'paid') await markPaid(session)
      break
    case 'checkout.session.expired':
      await query(
        "update orders set status = 'expired' where id = $1 and status = 'pending'",
        [Number(session.metadata?.order_id)],
      )
      break
    default:
      break // other events are ignored on purpose
  }
  // Any 2xx tells Stripe "got it". If the code above threw, Express answers 500 and Stripe retries later.
  res.json({ received: true })
}

async function markPaid(session) {
  const orderId = Number(session.metadata?.order_id)
  if (!Number.isInteger(orderId)) return

  await transaction(async (db) => {
    const {
      rows: [order],
    } = await db.query('select id, user_id, total_cents, status, stripe_session_id from orders where id = $1 for update', [orderId])
    if (!order) return console.error(`Webhook for unknown order ${orderId}`)
    if (order.status !== 'pending') return // Stripe can deliver the same event twice; the second time changes nothing
    if (order.stripe_session_id !== session.id) return console.error(`Order ${orderId}: session id does not match`)
    if (session.amount_total !== order.total_cents || session.currency !== 'usd') {
      return console.error(`Order ${orderId}: Stripe charged ${session.amount_total} ${session.currency}, expected ${order.total_cents} usd`)
    }

    await db.query(
      "update orders set status = 'paid', paid_at = now(), stripe_payment_id = $2 where id = $1",
      [orderId, typeof session.payment_intent === 'string' ? session.payment_intent : null],
    )
    // the books are really sold now: take them off the shelf (never below zero) and empty those lines from the cart
    await db.query(
      `update books b set stock = greatest(b.stock - i.quantity, 0)
         from order_items i where i.order_id = $1 and i.book_id = b.id`,
      [orderId],
    )
    await db.query(
      'delete from cart_items where user_id = $1 and book_id in (select book_id from order_items where order_id = $2)',
      [order.user_id, orderId],
    )
  })
}
