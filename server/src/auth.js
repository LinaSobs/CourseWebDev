import { betterAuth } from 'better-auth'
import { pool } from './db.js'
import { config } from './config.js'

// Better Auth is the auth library. Given a database pool it creates users, hashes passwords (scrypt),
// creates sessions and sets the session cookie. We only describe how we want it to behave.
export const auth = betterAuth({
  database: pool,                       // it reads/writes the "user", "session", "account" tables from schema.sql
  secret: config.authSecret,            // used to sign the session cookie so it can't be forged
  baseURL: config.publicUrl,            // the public address of the site (the browser-facing one)
  trustedOrigins: config.origins,       // only these sites may send sign-in requests (CSRF protection)
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,       // stay signed in for 30 days -> survives refreshes and browser restarts
    updateAge: 60 * 60 * 24,            // push the expiry forward at most once a day when the user is active
  },
})
