// Fills the Research & Book tables from seed/research.js.  Usage: npm run db:seed-research
import { pool } from '../src/db.js'
import { seedResearch } from '../src/researchSeed.js'

const n = await seedResearch()
console.log(`Research & Book seeded: ${n.news} news, ${n.papers} papers, ${n.books} books.`)
await pool.end()
