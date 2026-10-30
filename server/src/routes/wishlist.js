import { Router } from 'express'
import { query } from '../db.js'
import { httpError } from '../middleware.js'
import { BOOK_COLUMNS, toBook } from './catalog.js'

const router = Router() // mounted behind requireAuth

async function loadWishlist(userId) {
  const { rows } = await query(
    `select ${BOOK_COLUMNS}
       from wishlist_items w join books b on b.id = w.book_id
      where w.user_id = $1
      order by w.created_at desc`,
    [userId],
  )
  return { items: rows.map(toBook) }
}

// GET /api/wishlist
router.get('/', async (req, res) => res.json(await loadWishlist(req.user.id)))

// PUT /api/wishlist/:bookId -> save a book. Saving twice is harmless (do nothing on conflict).
router.put('/:bookId', async (req, res) => {
  const { rowCount } = await query('select 1 from books where id = $1', [req.params.bookId])
  if (!rowCount) throw httpError(404, 'Book not found')
  await query('insert into wishlist_items (user_id, book_id) values ($1, $2) on conflict do nothing', [req.user.id, req.params.bookId])
  res.json(await loadWishlist(req.user.id))
})

// DELETE /api/wishlist/:bookId
router.delete('/:bookId', async (req, res) => {
  await query('delete from wishlist_items where user_id = $1 and book_id = $2', [req.user.id, req.params.bookId])
  res.json(await loadWishlist(req.user.id))
})

export default router
