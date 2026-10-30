// Runs when the server starts, so the Research & Book page never shows empty tables:
//  1. creates the research tables if they are missing (db/research.sql is safe to run again)
//  2. fills them with the starter content if they are empty
//  3. pulls fresh news from the public API now and every 6 hours (turn off with RESEARCH_AUTO_IMPORT=off)
// If anything fails the server keeps running; the problem is only printed in the log.
import { readFile } from 'node:fs/promises'
import { pool } from './db.js'
import { seedResearch } from './researchSeed.js'
import { countRows, refreshFromApis } from './researchImport.js'

export async function ensureResearch() {
  try {
    if (process.env.RESEARCH_AUTO_SETUP === 'off') return
    const sql = await readFile(new URL('../db/research.sql', import.meta.url), 'utf8')
    await pool.query(sql)
    const c = await countRows()
    if (c.news === 0 || c.papers === 0 || c.books === 0) {
      const n = await seedResearch()
      console.log(`[research] tables were empty, added starter content: ${n.news} news, ${n.papers} papers, ${n.books} books`)
    }
  } catch (err) {
    console.error('[research] automatic setup failed:', err.message)
    return
  }

  if (process.env.RESEARCH_AUTO_IMPORT === 'off') return
  const run = async () => {
    const r = await refreshFromApis({ news: true, papers: false })
    console.log('[research] news refresh:', JSON.stringify(r))
  }
  run()
  setInterval(run, 6 * 60 * 60 * 1000).unref()
}
