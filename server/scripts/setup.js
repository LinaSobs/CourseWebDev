// One-command setup:  npm run setup
// Asks for your Neon connection string, cleans it, TESTS it, writes server/.env (with a fresh random secret),
// then creates the tables and loads the books. Run it again any time something is wrong with .env.
import { createInterface } from 'node:readline/promises'
import { randomBytes } from 'node:crypto'
import { existsSync, copyFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import pg from 'pg'

const ENV_PATH = new URL('../.env', import.meta.url)
const rl = createInterface({ input: process.stdin, output: process.stdout })

console.log(`
GlobalBooks setup
-----------------
In Neon: open your project -> click "Connect" -> turn ON "Show password" -> copy the connection string.
It looks like: postgresql://neondb_owner:npg_xxxx@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
(Copying the whole "psql '...'" line is fine too, I will cut out the part I need.)
`)

const raw = await rl.question('Paste your Neon connection string here: ')

// 1) clean it: find the postgres://... part, ignore quotes/spaces/the "psql" word
const match = raw.match(/postgres(?:ql)?:\/\/[^\s'"]+/)
if (!match) fail('I could not find a postgresql://... address in what you pasted.')
const url = match[0]

// 2) sanity checks for the usual mistakes
let parsed
try {
  parsed = new URL(url)
} catch {
  fail('That address is not valid. If your password contains @ # / or :, reset it in Neon (Roles -> Reset password) to get a simple one.')
}
if (parsed.username === 'user' || parsed.password === 'password' || /xxxx|your|change/i.test(url)) {
  fail('This is still the placeholder text from .env.example, not your real Neon string.')
}
if (!parsed.password) fail('There is no password in the string. In Neon turn on "Show password" before you copy.')
if (/^[*•●]+$/.test(decodeURIComponent(parsed.password))) fail('The password is hidden (stars/dots). In Neon turn on "Show password" and copy again.')

// 3) test the connection for real
console.log(`\nTesting the connection to ${parsed.hostname} as ${parsed.username} ...`)
const client = new pg.Client({ connectionString: url.replace('sslmode=require', 'sslmode=verify-full'), connectionTimeoutMillis: 20000 })
try {
  await client.connect()
  await client.query('select 1')
  await client.end()
} catch (err) {
  const hints = {
    '28P01': 'Wrong password for that user. In Neon: Roles -> Reset password, then copy the NEW string and run this again.',
    '3D000': 'The database name at the end of the address does not exist. Copy the string again from Neon.',
    ENOTFOUND: 'The host name is wrong (typo?). Copy the string again from Neon.',
    ETIMEDOUT: 'No answer. Check your internet / VPN / firewall. A sleeping Neon database can also need a retry.',
    ECONNREFUSED: 'Connection refused. Check the address and your internet / VPN.',
  }
  fail(`Connection failed (${err.code ?? err.message}).\n${hints[err.code] ?? err.message}`)
}
console.log('Connection works.')

// 4) write .env (keep a backup of an old one)
if (existsSync(ENV_PATH)) {
  copyFileSync(ENV_PATH, new URL('../.env.bak', import.meta.url))
  console.log('Old .env saved as .env.bak')
}
writeFileSync(
  ENV_PATH,
  `DATABASE_URL=${url}
BETTER_AUTH_SECRET=${randomBytes(32).toString('hex')}
BETTER_AUTH_URL=http://localhost:5173
CLIENT_ORIGINS=http://localhost:5173
PORT=4000
`,
)
console.log('server/.env written (it is git-ignored, never commit it).')

// 5) tables + books
console.log('\nCreating tables and loading books ...\n')
execSync('npm run db:setup', { stdio: 'inherit' })

console.log('\nAll done. Start the API with:  npm run dev   (then check http://localhost:4000/api/health)')
rl.close()

function fail(message) {
  console.error(`\nSetup stopped: ${message}\n`)
  process.exit(1)
}
