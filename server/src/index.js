import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { config } from './config.js'
import { query } from './db.js'
import { auth } from './auth.js'
import { attachUser, requireAuth, notFound, errorHandler } from './middleware.js'
import catalogRoutes from './routes/catalog.js'
import cartRoutes from './routes/cart.js'
import wishlistRoutes from './routes/wishlist.js'
import orderRoutes from './routes/orders.js'
import checkoutRoutes from './routes/checkout.js'
import { stripeWebhook } from './routes/stripeWebhook.js'
import formRoutes from './routes/forms.js'
import researchRoutes from './routes/research.js'
import { ensureResearch } from './researchSetup.js'

const app = express()

// Railway puts a proxy in front of us; this makes Express trust it (correct https / client IP detection).
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  next()
})
app.use(cors({ origin: config.origins, credentials: true }))

// 1) Auth routes: /api/auth/sign-up/email, /sign-in/email, /sign-out, /get-session ...
//    Better Auth handles all of them. It reads the raw request itself, so this MUST come before express.json().
app.all('/api/auth/*splat', toNodeHandler(auth))

// 1b) Stripe's webhook. Stripe signs the RAW request body, so this needs express.raw() and MUST come before express.json()
//     (json() would parse the body and break the signature check).
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

app.use(express.json({ limit: '50kb' }))

// 2) Our own API. Public routes first, then routes that need a signed-in user.
app.get('/api/health', async (_req, res) => {
  await query('select 1') // proves the database connection works, handy for Railway's health check
  res.json({ ok: true })
})
app.use('/api', catalogRoutes) //                                          GET  /api/groups, /api/books, /api/books/:id
app.use('/api', researchRoutes) //                                         GET  /api/research/news|papers|books|search|csrf, POST /api/research/orders
app.use('/api', formRoutes) //                                             POST /api/newsletter, /api/contact
app.use('/api/cart', attachUser, requireAuth, cartRoutes) //               needs login
app.use('/api/wishlist', attachUser, requireAuth, wishlistRoutes) //       needs login
app.use('/api/checkout', attachUser, requireAuth, checkoutRoutes) //        needs login: POST starts a Stripe payment
app.use('/api/orders', attachUser, requireAuth, orderRoutes) //            needs login: GET my orders / one order

app.use(notFound)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`GlobalBooks API listening on port ${config.port}`)
  ensureResearch() // create + fill the Research & Book tables if needed, then keep the news fresh
})
