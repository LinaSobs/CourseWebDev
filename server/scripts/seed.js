// Copies the shop's data (groups + books) from seed/catalog.js into Postgres.  Usage: npm run db:seed
// Safe to run again: "on conflict ... do update" refreshes the texts and prices but leaves stock untouched.
import { pool } from '../src/db.js'
import { groups, books } from '../seed/catalog.js'

const FEATURED_ID = 'cartographer' // book of the month

for (const [i, g] of groups.entries()) {
  await pool.query(
    `insert into groups (id, position, world, categories, title, home_line, kicker, headline, intro, cta, shelf_title, shelf_note, points)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     on conflict (id) do update set position = excluded.position, world = excluded.world, categories = excluded.categories, title = excluded.title, home_line = excluded.home_line,
       kicker = excluded.kicker, headline = excluded.headline, intro = excluded.intro, cta = excluded.cta,
       shelf_title = excluded.shelf_title, shelf_note = excluded.shelf_note, points = excluded.points`,
    [g.id, i, g.world, JSON.stringify(g.categories), g.title, g.homeLine, g.kicker, g.headline, g.intro, g.cta, g.shelfTitle, g.shelfNote, JSON.stringify(g.points)],
  )
}

// clear the old "book of the month" first, so the unique index (only one featured book) never complains
await pool.query('update books set is_featured = false')

for (const [i, b] of books.entries()) {
  await pool.query(
    `insert into books (id, group_id, position, title, author, detail, category, age_min, age_max, blurb, price_cents, is_new, is_featured)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     on conflict (id) do update set group_id = excluded.group_id, position = excluded.position, title = excluded.title,
       author = excluded.author, detail = excluded.detail, category = excluded.category, age_min = excluded.age_min, age_max = excluded.age_max, blurb = excluded.blurb, price_cents = excluded.price_cents,
       is_new = excluded.is_new, is_featured = excluded.is_featured`,
    [b.id, b.group, i, b.title, b.author, b.detail, b.category, b.ages?.[0] ?? null, b.ages?.[1] ?? null, b.blurb, Math.round(b.price * 100), Boolean(b.isNew), b.id === FEATURED_ID],
  )
}

console.log(`Seeded ${groups.length} groups and ${books.length} books.`)
await pool.end()
