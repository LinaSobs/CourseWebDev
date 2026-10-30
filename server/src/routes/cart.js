import { Router } from 'express'
import { query } from '../db.js'
import { httpError } from '../middleware.js'
import { BOOK_COLUMNS, toBook } from './catalog.js'

// Every route in this file is mounted behind requireAuth (see index.js), so req.user always exists here.
const router = Router()

const MAX_COPIES = 10
const parseQuantity = (value) => {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > MAX_COPIES) throw httpError(400, `Quantity must be a whole number from 1 to ${MAX_COPIES}.`)
  return n
}

// Reads the cart from the database and shapes it for the frontend. Every route below ends by sending this,
// so the browser always receives the full, up-to-date cart and never has to guess.
async function loadCart(userId) {
  const { rows } = await query(
    `select ${BOOK_COLUMNS}, c.quantity
       from cart_items c join books b on b.id = c.book_id
      where c.user_id = $1
      order by b.title`,
    [userId],
  )
  const items = rows.map((r) => ({ ...toBook(r), quantity: r.quantity }))
  const total = rows.reduce((sum, r) => sum + r.price_cents * r.quantity, 0) / 100
  return { items, total }
}

async function assertBookExists(bookId) {
  const { rowCount } = await query('select 1 from books where id = $1', [bookId])
  if (!rowCount) throw httpError(404, 'Book not found')
}

// GET /api/cart
router.get('/', async (req, res) => res.json(await loadCart(req.user.id)))

// POST /api/cart  { bookId, quantity }  -> ADD copies (adding the same book again increases the number)
router.post('/', async (req, res) => {
  const quantity = parseQuantity(req.body?.quantity ?? 1)
  await assertBookExists(req.body?.bookId)
  await query(
    `insert into cart_items (user_id, book_id, quantity) values ($1, $2, $3)
     on conflict (user_id, book_id) do update set quantity = least($4, cart_items.quantity + excluded.quantity)`,
    [req.user.id, req.body.bookId, quantity, MAX_COPIES],
  )
  res.status(201).json(await loadCart(req.user.id))
})

// PUT /api/cart/:bookId  { quantity }  -> SET the exact number (the + / - buttons in the cart)
router.put('/:bookId', async (req, res) => {
  const quantity = parseQuantity(req.body?.quantity)
  const { rowCount } = await query('update cart_items set quantity = $3 where user_id = $1 and book_id = $2', [
    req.user.id,
    req.params.bookId,
    quantity,
  ])
  if (!rowCount) throw httpError(404, 'That book is not in your cart.')
  res.json(await loadCart(req.user.id))
})

// DELETE /api/cart/:bookId
router.delete('/:bookId', async (req, res) => {
  await query('delete from cart_items where user_id = $1 and book_id = $2', [req.user.id, req.params.bookId])
  res.json(await loadCart(req.user.id))
})

export default router
