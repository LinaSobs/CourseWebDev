# How the backend works (assessment notes)

Everything you need to explain at assessment, in the order Farshid will probably ask.

## 1. The big picture

```
 Browser (React)                 Vercel                       Railway                 Neon
 ┌──────────────┐  /api/...  ┌───────────┐   rewrite   ┌──────────────────┐  SQL  ┌────────────┐
 │ client/      │ ─────────▶ │ serves    │ ──────────▶ │ server/ (Express)│ ────▶ │ Postgres   │
 │ fetch("/api")│ ◀───────── │ the site  │ ◀────────── │ + Better Auth    │ ◀──── │            │
 └──────────────┘   JSON     └───────────┘             └──────────────────┘       └────────────┘
```

- The **frontend** never talks to the database. It only calls our API and gets JSON back.
- The **API** is the only thing that holds the database password (`DATABASE_URL`).
- In the browser everything lives under **one address** (the Vercel URL). Requests that start with `/api` are forwarded to Railway
  (`client/vercel.json` in production, the proxy in `client/vite.config.js` in development).
  Why: the login cookie then belongs to the same site as the page. With two different domains, browsers (Safari especially)
  block or drop the cookie ("third-party cookie"), and you would also need CORS and `SameSite=None`.

## 2. Folder structure

```
server/
  src/
    index.js            starts Express: CORS, auth routes, then our routes, then error handling
    config.js           reads .env, stops with a clear message if something is missing
    db.js               the Postgres connection pool + query() + transaction()
    auth.js             Better Auth setup (the auth library)
    middleware.js       attachUser (who is this?), requireAuth (401 if nobody), error handler
    routes/
      catalog.js        GET /api/groups, /api/books, /api/books/:id        (public)
      forms.js          POST /api/newsletter, /api/contact                 (public)
      cart.js           GET/POST/PUT/DELETE /api/cart                      (needs login)
      wishlist.js       GET/PUT/DELETE /api/wishlist                       (needs login)
      orders.js         GET /api/orders, GET /api/orders/:id               (needs login)
      checkout.js       POST /api/checkout  -> pending order + Stripe page (needs login)
      stripeWebhook.js  POST /api/stripe/webhook  (called by Stripe, signature-checked)
  db/schema.sql         every table, readable top to bottom
  seed/catalog.js       the old hardcoded books, now only used to fill the database
  scripts/migrate.js    runs schema.sql        (npm run db:migrate)
  scripts/seed.js       copies seed data in    (npm run db:seed)

client/src/
  lib/api.js            the one fetch() helper (adds cookies, turns errors into Error objects)
  lib/authClient.js     Better Auth's browser client
  context/CatalogContext.jsx   loads groups + books once, everyone reads them
  context/ShopContext.jsx      who is signed in + cart + wishlist + dialogs
  components/           the UI (unchanged ones plus AuthDialog, CartDrawer, AccountPage, Toast)
```

Rule of thumb: **routes** talk HTTP, **db.js** talks SQL, **auth.js** talks login. Each file has one job.

## 3. The database in plain English

| Table | In one sentence |
|---|---|
| `user`, `account`, `session`, `verification` | Owned by Better Auth. A *user* is a person; their password hash sits in *account*; each signed-in browser gets a *session* row. |
| `groups` | The reader groups (kids, teens...) with the texts for their page. `world` says which half of the shop it belongs to (`kids` or `general`) and `categories` lists its sections. |
| `books` | Everything we sell. Belongs to one group. Price is in **cents** (integers don't have rounding errors). Has a `category` (its section) and, for kids' books, `age_min` and `age_max`. Has `stock` and a flag `is_featured` for "book of the month" (a unique index allows only one). |
| `cart_items` | "Osama has 2 copies of Deep Blue in his cart." Primary key `(user_id, book_id)` = one row per user per book. |
| `wishlist_items` | "Osama saved Static." Same key idea. |
| `orders` | One row per checkout: who, total, delivery address, when. |
| `order_items` | The lines of an order. Copies the **title and price at purchase time** so later price changes never rewrite old orders. |
| `newsletter_subscribers` | One row per email (email is the primary key, so no duplicates). |
| `contact_messages` | What people send through the contact form; topic-specific answers are in a JSON column. |

Relationships: a user has many cart items / wishlist items / orders; an order has many order items; a group has many books.
`on delete cascade` means deleting a user also deletes their cart, wishlist and orders.

## 4. How login works (be ready to draw this)

1. **Sign up:** the browser calls `authClient.signUp.email({name, email, password})` → `POST /api/auth/sign-up/email`.
   Better Auth hashes the password (scrypt — never stored in plain text), inserts a row in `user` and `account`,
   creates a row in `session`, and answers with a `Set-Cookie` header.
2. **The cookie** holds a signed session token. It is `HttpOnly` (JavaScript can't read it, so XSS can't steal it) and is sent
   automatically with every request to the same site.
3. **Every protected request:** `attachUser` calls `auth.api.getSession()` with the request's cookie → Better Auth looks the token
   up in the `session` table → `req.user` is set. `requireAuth` answers **401** if `req.user` is empty.
4. **Surviving a refresh:** on page load `authClient.useSession()` asks `/api/auth/get-session`. The cookie is still there, so the
   server says who you are and the header shows "Sign out". The session lasts 30 days (`auth.js`).
5. **Sign out:** `authClient.signOut()` deletes the session row and clears the cookie.

Important design point: **the server never trusts the browser about who the user is.** Routes use `req.user.id` from the session,
never a `userId` sent in the request body, so nobody can read another person's cart by changing a number.

## 5. API reference

| Method + path | Login? | What it does |
|---|---|---|
| `GET /api/health` | no | Checks the server and the database are alive |
| `GET /api/groups` | no | The reader groups, with `world` and `categories` |
| `GET /api/books?group=&category=&ageFrom=&ageTo=&q=&min=&max=&sort=` | no | Books; every filter optional (`ageFrom`/`ageTo` match books whose age range overlaps); `sort` = `price_asc`, `price_desc`, `title`, `new` |
| `GET /api/books/:id` | no | One book (404 if unknown) |
| `POST /api/newsletter` `{email}` | no | Subscribe (same answer if already subscribed) |
| `POST /api/contact` | no | Save a contact message (linked to the user if signed in) |
| `GET /api/cart` | yes | My cart + total |
| `POST /api/cart` `{bookId, quantity}` | yes | Add copies (max 10 per book) |
| `PUT /api/cart/:bookId` `{quantity}` | yes | Set an exact number |
| `DELETE /api/cart/:bookId` | yes | Remove |
| `GET/PUT/DELETE /api/wishlist[/:bookId]` | yes | List / save / un-save |
| `GET /api/orders` | yes | My order history |
| `POST /api/checkout` `{name, address, country}` | yes | Saves a pending order, returns `{ url }` of Stripe's payment page |
| `GET /api/orders/:id` | yes | One of my orders (the success page polls this until it is `paid`) |
| `POST /api/stripe/webhook` | Stripe signature | The ONLY thing that marks an order `paid` |
| `/api/auth/*` | — | Handled entirely by Better Auth |

Status codes used: 200/201 ok, 400 bad input, 401 not signed in, 404 not found, 409 conflict (not enough stock), 500 our bug.

**Checkout is a transaction** (`routes/orders.js`): read the cart → for each line `UPDATE books SET stock = stock - n WHERE stock >= n`
→ create the order → copy the lines → empty the cart. If any step fails, `ROLLBACK` undoes everything. The `stock >= n` inside the
UPDATE means two people can't both buy the last copy.

**SQL injection:** every query uses `$1, $2` placeholders; user text is never glued into SQL. The only dynamic SQL is `ORDER BY`,
which comes from a fixed whitelist (`SORTS` in `catalog.js`).

## 6. Setup checklist (local)

1. Create a free project on [neon.tech](https://neon.tech), copy the connection string.
2. `cd server && cp .env.example .env` and fill `DATABASE_URL`; generate `BETTER_AUTH_SECRET` with the command written in the file.
3. `npm install && npm run db:setup` → tables + 50 books.
4. `npm run dev` (server) and, in `client/`, `npm install && npm run dev`.
5. Check: <http://localhost:4000/api/books> shows JSON; <http://localhost:5173> shows the shop; create an account, refresh, still signed in.

## 7. Deploy checklist

**Database:** the same Neon database works for production (run `npm run db:setup` once against it).

**Backend → Railway**
1. New project → *Deploy from GitHub repo* → choose this repo → Settings → **Root Directory = `server`**.
2. Variables: `DATABASE_URL`, `BETTER_AUTH_SECRET` (a fresh random one), `NODE_ENV=production`,
   and — after you know the Vercel URL — `BETTER_AUTH_URL=https://<your-app>.vercel.app` and `CLIENT_ORIGINS=https://<your-app>.vercel.app`.
3. Start command: `npm start` (Railway detects it). Settings → Networking → *Generate domain*. Test `https://<railway-domain>/api/health`.

**Frontend → Vercel**
1. Import the repo → **Root Directory = `client`** (framework: Vite, build `npm run build`, output `dist`).
2. Open `client/vercel.json` and replace `REPLACE-WITH-YOUR-RAILWAY-DOMAIN` with your Railway domain, commit, push.
3. Go back to Railway and set `BETTER_AUTH_URL` / `CLIENT_ORIGINS` to the final Vercel URL → redeploy.

**Verify on the live URL:** books load, sign up, refresh (still signed in), add to cart, checkout, order shows in My account.

## 8. Security checklist ("no secrets committed")

- `.gitignore` excludes `.env` and `.env.*` (but keeps `.env.example`). Prove it: `git check-ignore -v server/.env`
  and `git ls-files | grep -i env` should list only `.env.example` files.
- If a secret was ever committed by accident, rotating it (new Neon password, new `BETTER_AUTH_SECRET`) is the fix; deleting the file is not enough because git remembers.
- Production uses different secrets from local development.

## 9. Questions to expect

- *Why Express and a separate server?* The API is its own program; the database password never reaches the browser.
- *Why a connection pool?* Opening a database connection is slow; a pool reuses a few.
- *Why cents?* `0.1 + 0.2 !== 0.3` in JavaScript; integers are exact.
- *Why snapshot price in `order_items`?* Receipts must not change when the catalog does.
- *Why does `/api/auth/*` come before `express.json()`?* Better Auth reads the raw request body itself.
- *Where is the password?* Only as a scrypt hash in `account.password`, written by Better Auth.
- *What happens if the cookie is stolen / expired?* Expired → session row ignored → 401. Sign-out deletes the row.

## 10. Honest limits and next steps

- Payments use Stripe Checkout in TEST mode (fake money). No email verification or password reset (needs an email service).
- No rate limiting on public forms yet (`express-rate-limit` would be the next step).
- Free tiers sleep: Neon pauses idle databases, so the first request after a break can take a few seconds (the site shows "Opening the shop…").
