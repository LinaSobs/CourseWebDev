import { Router } from 'express'
import { query } from '../db.js'
import { httpError } from '../middleware.js'

const router = Router() // mounted behind requireAuth

// One query for both routes: orders of one user (optionally just one order), each with its lines.
// json_agg packs the lines into one JSON list per order.
async function loadOrders(userId, orderId = null) {
  const { rows } = await query(
    `select o.id, o.total_cents, o.status, o.created_at, o.paid_at, o.ship_name, o.ship_address, o.ship_country,
            coalesce(
              json_agg(json_build_object('bookId', i.book_id, 'title', i.title, 'quantity', i.quantity, 'unitPriceCents', i.unit_price_cents)
                       order by i.title) filter (where i.book_id is not null),
              '[]') as items
       from orders o left join order_items i on i.order_id = o.id
      where o.user_id = $1 and ($2::int is null or o.id = $2)
      group by o.id
      order by o.created_at desc`,
    [userId, orderId],
  )
  return rows.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total_cents / 100,
    createdAt: o.created_at,
    paidAt: o.paid_at,
    shipTo: { name: o.ship_name, address: o.ship_address, country: o.ship_country },
    items: o.items.map((i) => ({ bookId: i.bookId, title: i.title, quantity: i.quantity, unitPrice: i.unitPriceCents / 100 })),
  }))
}

// GET /api/orders -> my orders, newest first
router.get('/', async (req, res) => {
  res.json(await loadOrders(req.user.id))
})

// GET /api/orders/:id -> one of MY orders. The success page calls this repeatedly until the webhook has marked it 'paid'.
// "where user_id = me" means you can never read someone else's order by guessing a number.
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) throw httpError(400, 'That is not a valid order number.')
  const [order] = await loadOrders(req.user.id, id)
  if (!order) throw httpError(404, 'Order not found.')
  res.json(order)
})

// There is deliberately NO "create order" route here any more: orders are created by POST /api/checkout
// (routes/checkout.js) and become 'paid' only through Stripe's webhook (routes/stripeWebhook.js).

export default router
