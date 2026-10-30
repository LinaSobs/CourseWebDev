import pg from 'pg'
import { config } from './config.js'

// One shared connection pool for the whole server (our queries AND Better Auth use it).
// A pool keeps a few connections open and lends them out, which is much faster than reconnecting per request.
export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })

// Shortcut for one-off queries: query('select * from books where id = $1', [id])
// Always pass values as $1, $2... (never glue them into the SQL string) - that is what prevents SQL injection.
export const query = (text, params) => pool.query(text, params)

// Runs several queries as ONE all-or-nothing unit (used by checkout).
// If anything throws, ROLLBACK undoes everything, so we never end up with half an order.
export async function transaction(work) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const result = await work(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }
}
