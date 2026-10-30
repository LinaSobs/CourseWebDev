import { Router } from 'express'
import { query } from '../db.js'
import { attachUser, httpError } from '../middleware.js'

const router = Router() // public: visitors don't need an account

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

// POST /api/newsletter  { email }
router.post('/newsletter', async (req, res) => {
  const email = clean(req.body?.email, 254).toLowerCase()
  if (!EMAIL.test(email)) throw httpError(400, 'That email doesn’t look right.')
  // already subscribed? "do nothing" - and we answer the same way, so nobody can use this form to find out who is subscribed
  await query('insert into newsletter_subscribers (email) values ($1) on conflict do nothing', [email])
  res.status(201).json({ ok: true })
})

// POST /api/contact  { topic, name, email, message, details: {...} }
// attachUser is optional here: if the person happens to be signed in, we link the message to their account.
router.post('/contact', attachUser, async (req, res) => {
  const topic = clean(req.body?.topic, 80)
  const name = clean(req.body?.name, 120)
  const email = clean(req.body?.email, 254)
  const message = clean(req.body?.message, 4000)
  if (!topic || !name) throw httpError(400, 'Please tell us what you need and your name.')
  if (!EMAIL.test(email)) throw httpError(400, 'That email doesn’t look right.')

  // `details` holds the extra fields that depend on the topic (budget, order number...). Keep only short text values.
  const details = {}
  for (const [key, value] of Object.entries(req.body?.details ?? {}).slice(0, 12)) {
    if (typeof value === 'string' && value.trim()) details[key.slice(0, 40)] = value.trim().slice(0, 500)
  }

  await query('insert into contact_messages (user_id, topic, name, email, details, message) values ($1, $2, $3, $4, $5, $6)', [
    req.user?.id ?? null,
    topic,
    name,
    email,
    details,
    message,
  ])
  res.status(201).json({ ok: true })
})

export default router
