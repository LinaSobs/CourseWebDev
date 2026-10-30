// Pulls real news and open-access papers from public APIs into the database.
//   npm run db:import-research              news + papers
//   npm run db:import-research -- --news    only news
//   npm run db:import-research -- --papers  only papers
// Optional: set CONTACT_EMAIL in .env (OpenAlex asks for one so they can reach you; it gets you faster answers).
import { pool } from '../src/db.js'
import { importNews, importPapers } from '../src/researchImport.js'

const only = process.argv.slice(2)
const wantNews = only.length === 0 || only.includes('--news')
const wantPapers = only.length === 0 || only.includes('--papers')

try {
  if (wantNews) console.log('News:', await importNews())
  if (wantPapers) console.log('Papers:', await importPapers())
} catch (err) {
  console.error('Import failed:', err.message, '\nCheck your internet connection and try again.')
  process.exitCode = 1
}
await pool.end()
