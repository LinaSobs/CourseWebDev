// Reads settings from environment variables (.env locally, the Railway dashboard in production)
// and stops the server at startup if something important is missing, instead of failing later in a confusing way.
const required = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL']
const missing = required.filter((name) => !process.env[name])
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`)
  process.exit(1)
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  // Neon gives ...?sslmode=require. pg treats that as 'verify-full' anyway but prints a scary warning,
  // so we say 'verify-full' explicitly (same secure behaviour, no warning).
  databaseUrl: process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full'),
  authSecret: process.env.BETTER_AUTH_SECRET,
  publicUrl: process.env.BETTER_AUTH_URL,
  // allowed browser origins: the public URL plus anything listed in CLIENT_ORIGINS
  origins: [process.env.BETTER_AUTH_URL, ...(process.env.CLIENT_ORIGINS ?? '').split(',')]
    .map((o) => o?.trim())
    .filter(Boolean),
  isProd: process.env.NODE_ENV === 'production',
  // Stripe (test mode keys start with sk_test_ / whsec_). Optional at startup so the shop still runs without them;
  // checkout answers "payments are not set up" until they exist.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
}
