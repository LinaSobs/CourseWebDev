// Creates (or updates) all tables by running db/schema.sql (the shop) and db/research.sql (Research & Book page).
// Usage: npm run db:migrate
import { readFile } from 'node:fs/promises'
import { pool } from '../src/db.js'

for (const file of ['schema.sql', 'research.sql']) {
  const sql = await readFile(new URL(`../db/${file}`, import.meta.url), 'utf8')
  await pool.query(sql) // the files have no parameters, so Postgres accepts many statements in one go
  console.log(`${file} is up to date.`)
}
await pool.end()
