// Research & Book page API.
//   GET  /api/research/news                 latest news, newest first (+ hero story flag)
//   GET  /api/research/papers?level=        research papers (level filter runs in SQL)
//   GET  /api/research/books?level=&q=      books for the shelf and for the order window
//   GET  /api/research/search?q=&type=&level=   full-text search over news + papers + books
//   GET  /api/research/csrf                 short-lived token the order form must send back
//   POST /api/research/orders               place an order (prices + stock are checked HERE, never trusted from the browser)
import { Router } from 'express'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { query, transaction } from '../db.js'
import { config } from '../config.js'
import { httpError } from '../middleware.js'

const router = Router()

const LEVELS = ['beginner', 'intermediate', 'advanced']
const TYPES = ['news', 'paper', 'book']

// ---------------------------------------------------------------- small helpers

// Reads ?level= and refuses anything that is not one of the three levels (so SQL only ever sees a known word).
function readLevel(value) {
  if (value === undefined || value === '') return null
  if (typeof value !== 'string' || !LEVELS.includes(value)) throw httpError(400, 'level must be beginner, intermediate or advanced.')
  return value
}

// "research/news-gan-1200.webp" -> srcsets for 480/800/1200 in AVIF and WebP.
// The browser picks the best format it understands and the smallest width that fits the screen.
function imageSet(url) {
  if (/^https:\/\//.test(url)) return { src: url, webp: null, avif: null, remote: true } // imported news uses the publisher's own picture
  const base = url.replace(/-1200\.webp$/, '')
  const set = (ext) => [480, 800, 1200].map((w) => `${base}-${w}.${ext} ${w}w`).join(', ')
  return { src: `${base}-800.webp`, webp: set('webp'), avif: set('avif') }
}

// Turns what a person typed into a safe Postgres tsquery: only letters and digits survive, every word becomes a
// prefix match ("quan" finds "quantum"), words are AND-ed. Quotes, & | ! ( ) : < > and friends can never reach SQL.
function toTsQuery(raw) {
  if (typeof raw !== 'string') return null
  const words = raw.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  const clean = words.slice(0, 6).map((w) => w.slice(0, 40))
  return clean.length ? clean.map((w) => `${w}:*`).join(' & ') : null
}

// Tiny in-memory rate limiter (per IP). Enough to stop a script hammering checkout or search;
// if you ever run several server copies, move this to Redis.
const hits = new Map()
function rateLimit(name, max, windowMs) {
  return (req, _res, next) => {
    const key = `${name}:${req.ip}`
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    if (recent.length >= max) return next(httpError(429, 'Too many requests. Please wait a moment and try again.'))
    recent.push(now)
    hits.set(key, recent)
    next()
  }
}
setInterval(() => hits.clear(), 60 * 60 * 1000).unref() // forget old entries once an hour

// ---------------------------------------------------------------- CSRF
// CSRF = another website tricking your browser into sending a request to ours.
// Defence: (1) the Origin header must be one of our own sites, (2) the request must carry a token that only our own
// pages can fetch (other sites are blocked from reading /csrf by CORS). The token is signed with the server secret
// and expires after 30 minutes, so the server remembers nothing.
const CSRF_TTL_MS = 30 * 60 * 1000
const sign = (stamp) => createHmac('sha256', config.authSecret).update(`research-csrf:${stamp}`).digest('hex')

function checkCsrf(req, _res, next) {
  const origin = req.get('origin')
  if (origin && !config.origins.includes(origin)) return next(httpError(403, 'Request blocked (unknown origin).'))
  const token = req.get('x-csrf-token') ?? ''
  const [stamp, mac] = token.split('.')
  const age = Date.now() - Number(stamp)
  const good = stamp && mac && age >= 0 && age < CSRF_TTL_MS && mac.length === 64 && timingSafeEqual(Buffer.from(mac), Buffer.from(sign(stamp)))
  if (!good) return next(httpError(403, 'Your order form expired. Please reload the page and try again.'))
  next()
}

router.get('/research/csrf', (_req, res) => {
  const stamp = Date.now()
  res.set('Cache-Control', 'no-store').json({ token: `${stamp}.${sign(stamp)}` })
})

// ---------------------------------------------------------------- news
router.get('/research/news', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 50)
  const { rows } = await query(
    `select a.id, a.slug, a.title, a.summary, a.body, a.hero_image_url, a.hero_image_alt, a.published_at, a.category, a.is_featured, a.source_url, a.source_name,
            coalesce(json_agg(au.name order by x.position) filter (where au.id is not null), '[]') as authors
       from research.news_articles a
       left join research.news_article_authors x on x.article_id = a.id
       left join research.authors au on au.id = x.author_id
      group by a.id
      order by a.published_at desc
      limit $1`,
    [limit],
  )
  // The feed barely changes, so let browsers and the host's CDN keep it for a few minutes.
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  res.json(rows.map((r) => ({ ...r, image: imageSet(r.hero_image_url), hero_image_url: undefined })))
})

// ---------------------------------------------------------------- papers
router.get('/research/papers', async (req, res) => {
  const level = readLevel(req.query.level)
  const { rows } = await query(
    `select p.id, p.title, p.abstract, p.doi, p.publication_date::text as publication_date, p.journal_or_source,
            p.difficulty_level, p.pdf_url,
            coalesce(json_agg(au.name order by x.position) filter (where au.id is not null), '[]') as authors
       from research.research_papers p
       left join research.research_paper_authors x on x.paper_id = p.id
       left join research.authors au on au.id = x.author_id
      where ($1::text is null or p.difficulty_level = $1)
      group by p.id
      order by p.publication_date desc`,
    [level],
  )
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  res.json(rows)
})

// ---------------------------------------------------------------- books
const bookColumns = `id, slug, title, author, isbn, description, cover_image_url, price::float8 as price, difficulty_level, stock_quantity, category`

router.get('/research/books', async (req, res) => {
  const level = readLevel(req.query.level)
  const tsq = toTsQuery(req.query.q)
  const { rows } = await query(
    `select ${bookColumns}
       from research.books
      where ($1::text is null or difficulty_level = $1)
        and ($2::text is null or search @@ to_tsquery('english', $2))
      order by case when $2::text is null then 0 else -ts_rank(search, to_tsquery('english', $2)) end, title
      limit 60`,
    [level, tsq],
  )
  // stock changes, so browsers may keep it but must check with the server first (cheap 304 thanks to the ETag)
  res.set('Cache-Control', 'no-cache')
  res.json(rows)
})

// ---------------------------------------------------------------- search
router.get('/research/search', rateLimit('search', 120, 60 * 1000), async (req, res) => {
  const level = readLevel(req.query.level)
  const type = req.query.type ?? ''
  if (type !== '' && !TYPES.includes(type)) throw httpError(400, 'type must be news, paper or book.')
  const tsq = toTsQuery(req.query.q)
  if (!tsq) return res.json({ results: [] })

  // One query per content type. Postgres full-text search (a GIN index on a tsvector column) does the matching and ranking.
  // News has no difficulty level, so a level filter hides it.
  const jobs = []
  if ((!type || type === 'news') && !level) {
    jobs.push(
      query(
        `select 'news' as type, id, title, summary as snippet, category as meta, null::text as level, slug as ref, ts_rank(search, q) as rank
           from research.news_articles, to_tsquery('english', $1) q where search @@ q order by rank desc limit 6`,
        [tsq],
      ),
    )
  }
  if (!type || type === 'paper') {
    jobs.push(
      query(
        `select 'paper' as type, id, title, abstract as snippet, journal_or_source as meta, difficulty_level as level, id::text as ref, ts_rank(search, q) as rank
           from research.research_papers, to_tsquery('english', $1) q
          where search @@ q and ($2::text is null or difficulty_level = $2) order by rank desc limit 6`,
        [tsq, level],
      ),
    )
  }
  if (!type || type === 'book') {
    jobs.push(
      query(
        `select 'book' as type, id, title, description as snippet, author as meta, difficulty_level as level, slug as ref, ts_rank(search, q) as rank
           from research.books, to_tsquery('english', $1) q
          where search @@ q and ($2::text is null or difficulty_level = $2) order by rank desc limit 6`,
        [tsq, level],
      ),
    )
  }
  const results = (await Promise.all(jobs)).flatMap((r) => r.rows).sort((a, b) => b.rank - a.rank)
  res.set('Cache-Control', 'private, max-age=30')
  res.json({ results: results.map(({ rank, ...r }) => r) })
})

// ---------------------------------------------------------------- orders
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

router.post('/research/orders', rateLimit('order', 8, 10 * 60 * 1000), checkCsrf, async (req, res) => {
  const body = req.body ?? {}
  const name = clean(body.name, 100)
  const email = clean(body.email, 254).toLowerCase()
  const address = clean(body.address, 300)
  if (name.length < 2) throw httpError(400, 'Please enter your name.')
  if (!EMAIL.test(email)) throw httpError(400, 'Please enter a valid email address.')
  if (address.length < 6) throw httpError(400, 'Please enter your delivery address.')

  // The browser only tells us WHICH books and HOW MANY. Everything else comes from our own database.
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) throw httpError(400, 'Your cart is empty.')
  const wanted = new Map()
  for (const item of body.items) {
    const bookId = Number(item?.bookId)
    const quantity = Number(item?.quantity)
    if (!Number.isInteger(bookId) || bookId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw httpError(400, 'Each book needs a quantity between 1 and 10.')
    }
    wanted.set(bookId, Math.min((wanted.get(bookId) ?? 0) + quantity, 10)) // same book twice -> add up
  }
  const ids = [...wanted.keys()].sort((a, b) => a - b)

  const order = await transaction(async (db) => {
    // "for update" locks these book rows until we finish, so two people cannot both buy the last copy.
    // Sorted ids = every request locks in the same order, so two orders can never wait on each other forever.
    const { rows: books } = await db.query(`select id, title, price::text as price, stock_quantity from research.books where id = any($1) order by id for update`, [ids])
    if (books.length !== ids.length) throw httpError(400, 'One of the books in your cart no longer exists.')

    let totalCents = 0
    const lines = books.map((b) => {
      const quantity = wanted.get(b.id)
      if (b.stock_quantity < quantity) {
        throw httpError(409, b.stock_quantity === 0 ? `“${b.title}” is sold out.` : `Only ${b.stock_quantity} left of “${b.title}”.`)
      }
      const unitCents = Math.round(Number(b.price) * 100)
      totalCents += unitCents * quantity
      return { book: b, quantity, unitCents }
    })

    const customer = await db.query(
      `insert into research.customers (name, email, address) values ($1,$2,$3)
       on conflict (lower(email)) do update set name = excluded.name, address = excluded.address
       returning id`,
      [name, email, address],
    )
    const total = (totalCents / 100).toFixed(2)
    const created = await db.query(`insert into research.orders (customer_id, total_price, status) values ($1,$2,'placed') returning id, order_date`, [customer.rows[0].id, total])
    for (const l of lines) {
      await db.query(`insert into research.order_items (order_id, book_id, quantity, unit_price) values ($1,$2,$3,$4)`, [created.rows[0].id, l.book.id, l.quantity, (l.unitCents / 100).toFixed(2)])
      await db.query(`update research.books set stock_quantity = stock_quantity - $2 where id = $1`, [l.book.id, l.quantity])
    }
    return {
      id: created.rows[0].id,
      total: Number(total),
      items: lines.map((l) => ({ title: l.book.title, quantity: l.quantity, unitPrice: l.unitCents / 100 })),
    }
  })

  // Only the receipt goes back. Customer details are never returned by any endpoint.
  res.status(201).set('Cache-Control', 'no-store').json({ order })
})

export default router
