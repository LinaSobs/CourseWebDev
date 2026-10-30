import { fromNodeHeaders } from 'better-auth/node'
import { auth } from './auth.js'

// Runs on every request: asks Better Auth "who is this?" using the session cookie.
// Result: req.user is the signed-in user object, or null for visitors.
export async function attachUser(req, _res, next) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  req.user = session?.user ?? null
  next()
}

// Put this in front of any route that needs a logged-in user. 401 = "who are you?"
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in first.' })
  next()
}

// Tiny helper for validation errors: throw httpError(400, '...') anywhere in a route.
export const httpError = (status, message) => Object.assign(new Error(message), { status })

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' })
}

// Last stop for every error. Express 5 sends errors from async routes here automatically.
export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500
  if (status === 500) console.error(err) // log real bugs, but never leak details to the browser
  res.status(status).json({ error: status === 500 ? 'Something went wrong on our side.' : err.message })
}
