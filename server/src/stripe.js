import Stripe from 'stripe'
import { config } from './config.js'

// One Stripe client for the whole server. It is null when STRIPE_SECRET_KEY is missing, and the routes check for that.
export const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null

if (stripe && config.isProd && config.stripeSecretKey.startsWith('sk_test_')) {
  console.log('Stripe is running in TEST mode: payments use fake money.')
}
if (!stripe) console.warn('STRIPE_SECRET_KEY is not set: checkout is disabled until you add it to .env.')
