import { Router } from 'express'
import { query } from '../db.js'
import { httpError } from '../middleware.js'

const router = Router()

// Database rows use snake_case and cents; the frontend wants camelCase and dollars.
// This one function is the only place that translation happens (also used by cart + wishlist).
export const BOOK_COLUMNS = 'b.id, b.group_id, b.title, b.author, b.detail, b.category, b.age_min, b.age_max, b.blurb, b.price_cents, b.is_new, b.is_featured, b.stock'
export const toBook = (r) => ({
  id: r.id,
  group: r.group_id,
  title: r.title,
  author: r.author,
  detail: r.detail,
  category: r.category,
  ageMin: r.age_min,
  ageMax: r.age_max,
  blurb: r.blurb,
  price: r.price_cents / 100,
  isNew: r.is_new,
  isFeatured: r.is_featured,
  stock: r.stock,
})

// GET /api/groups  -> the reader groups (menu, home tiles, page headlines, and their categories)
router.get('/groups', async (_req, res) => {
  const { rows } = await query('select * from groups order by position')
  res.json(
    rows.map((g) => ({
      id: g.id,
      world: g.world,
      categories: g.categories,
      title: g.title,
      homeLine: g.home_line,
      kicker: g.kicker,
      headline: g.headline,
      intro: g.intro,
      cta: g.cta,
      shelfTitle: g.shelf_title,
      shelfNote: g.shelf_note,
      points: g.points,
    })),
  )
})

// How the ?sort= query value maps to SQL. A fixed list (a "whitelist"), because we must never put raw user text after ORDER BY.
const SORTS = {
  price_asc: 'b.price_cents asc, b.position',
  price_desc: 'b.price_cents desc, b.position',
  title: 'b.title asc',
  new: 'b.is_new desc, b.position',
}

// GET /api/books?group=kids&category=bedtime&ageFrom=3&ageTo=5&q=moon&min=10&max=20&sort=price_asc   (every filter is optional)
router.get('/books', async (req, res) => {
  const { group, category, ageFrom, ageTo, q, min, max, sort } = req.query
  const params = []
  const where = []
  // p(value) stores the value and returns its placeholder ($1, $2, ...). Values never touch the SQL text.
  const p = (value) => `$${params.push(value)}`

  if (typeof group === 'string' && group) where.push(`b.group_id = ${p(group)}`)
  if (typeof category === 'string' && category) where.push(`b.category = ${p(category)}`)
  // a book matches an age range if the two ranges overlap (a 4-7 book fits "ages 6 to 8")
  if (ageTo !== undefined && Number.isFinite(Number(ageTo))) where.push(`b.age_min <= ${p(Number(ageTo))}`)
  if (ageFrom !== undefined && Number.isFinite(Number(ageFrom))) where.push(`b.age_max >= ${p(Number(ageFrom))}`)
  if (typeof q === 'string' && q.trim()) {
    const like = p(`%${q.trim().replace(/[\\%_]/g, '\\$&')}%`) // escape % and _ so they are searched literally
    where.push(`(b.title ilike ${like} or b.author ilike ${like})`)
  }
  if (min !== undefined && Number.isFinite(Number(min))) where.push(`b.price_cents >= ${p(Math.round(Number(min) * 100))}`)
  if (max !== undefined && Number.isFinite(Number(max))) where.push(`b.price_cents <= ${p(Math.round(Number(max) * 100))}`)

  const orderBy = SORTS[sort] ?? 'b.group_id, b.position'
  const sql = `select ${BOOK_COLUMNS} from books b ${where.length ? `where ${where.join(' and ')}` : ''} order by ${orderBy}`
  const { rows } = await query(sql, params)
  res.json(rows.map(toBook))
})

// GET /api/books/:id
router.get('/books/:id', async (req, res) => {
  const { rows } = await query(`select ${BOOK_COLUMNS} from books b where b.id = $1`, [req.params.id])
  if (!rows[0]) throw httpError(404, 'Book not found')
  res.json(toBook(rows[0]))
})

export default router
