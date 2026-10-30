# Manual: build and run GlobalBooks from VS Code, step by step

Two ways to use this file:

- **Part A (15 minutes):** get the finished project running on your computer.
- **Part B (the real learning):** rebuild the backend in the same order it was designed, with a checkpoint after every step.
  If you can redo Part B without looking, you can explain it at assessment.

---

## Part A: run it

### A1. Install the tools (once)

| Tool | Why | Check in the VS Code terminal |
|---|---|---|
| Node.js 20 or newer (nodejs.org, LTS) | runs the server and the build | `node -v` |
| Git | version control | `git --version` |
| VS Code + the recommended extensions | editor (VS Code offers them when you open the folder) | – |
| Free accounts: GitHub, Neon, Railway, Vercel | repo, database, backend hosting, frontend hosting | – |

Open the terminal inside VS Code with **Ctrl + `** (Mac: **Cmd + `**).

### A2. Open the project

1. VS Code → **File → Open Folder…** → choose `CourseWebDev` (the folder that contains `client`, `server`, `docs`).
2. Click **Install** when VS Code asks about the recommended extensions.
3. Look at the left sidebar. You should see `client/`, `server/`, `docs/`.

### A3. Create the database (Neon)

1. neon.tech → sign up → **Create project** (any name, pick the region closest to Berlin, e.g. Frankfurt).
2. On the project page click **Connect** → copy the connection string (it starts with `postgresql://` and ends with `?sslmode=require`).

### A4. Install the server and let the setup command do `.env` for you

```bash
cd server
npm install
npm run setup
```

`npm run setup` asks for the Neon connection string, tests it, writes `server/.env` (with a freshly generated secret),
creates the tables and loads the 50 books. If something is wrong it says exactly what (wrong password, typo in host, hidden password...).
You can run it again any time.

In Neon the string is under **Connect**. Turn on **Show password** before you copy, otherwise you copy stars instead of the password.
Manual way (not recommended): copy `.env.example` to `.env` and edit every line. Never commit `.env`.

### A5. Install and start

Use **Terminal → Run Task…** (tasks come from `.vscode/tasks.json`) or type the commands:

```bash
cd server
npm run dev                                       # API on http://localhost:4000 (tables were created by npm run setup)

# second terminal (the "+" button in the terminal panel)
cd client && npm install && npm run dev           # site on http://localhost:5173
```

`Run Everything (server + client)` starts both servers at once.

### A6. Check it works

1. <http://localhost:4000/api/health> shows `{"ok":true}`.
2. <http://localhost:4000/api/books> shows a list of books as JSON.
3. <http://localhost:5173> shows the shop. Create an account, **refresh the page**, you are still signed in.
4. Add a book to the cart → Checkout → open **My account**: the order is there.
5. In Neon → **SQL Editor** run `select * from orders;` and `select email from "user";` to see your data.

> After your first `npm install`, **commit the new `package-lock.json` files** (client and server). Hosting providers use them for repeatable installs.

---

## Part B: build it yourself, in order

Rule: after each step, run the **checkpoint**. Never write the next file while the checkpoint is red.
Each step names the finished file in this repo, so you can compare or copy and then explain it.

### Step 0: the foundation

1. `git init` (already done in this repo). Create `.gitignore` **before the first commit** with at least `node_modules`, `dist`, `.env`, `.env.*`, `!.env.example`.
2. Folders: `client/` (your Week 1–2 React app moves here) and `server/`.
3. Checkpoint: `git status` does not list any `.env` file.

### Step 1: an empty server

```bash
mkdir server && cd server
npm init -y
npm install express pg better-auth cors
```

In `package.json` add `"type": "module"` (so you can use `import`) and scripts:
`"dev": "node --watch --env-file=.env src/index.js"`, `"start": "node src/index.js"`.

Create `src/index.js`:

```js
import express from 'express'
const app = express()
app.get('/api/health', (req, res) => res.json({ ok: true }))
app.listen(4000, () => console.log('API on 4000'))
```

Checkpoint: `npm run dev`, open <http://localhost:4000/api/health> → `{"ok":true}`.
*What you learned:* a route = method + path + function that sends a response.

### Step 2: configuration and secrets

- `.env` holds `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGINS`. Template: `server/.env.example`.
- `src/config.js` reads `process.env` once and stops with a clear message if something is missing.

Checkpoint: delete one value from `.env` → server refuses to start and names it. Put it back.

### Step 3: connect to Postgres

`src/db.js`: create a `pg.Pool` from `DATABASE_URL`, export `query()` and `transaction()` (the finished file is commented line by line).
Change the health route to run `await query('select 1')`.

Checkpoint: `/api/health` still returns ok. Break the password in `.env` → it errors. Fix it.
*What you learned:* a pool reuses connections; `$1, $2` placeholders protect against SQL injection.

### Step 4: design the schema

Open `server/db/schema.sql` and read it top to bottom. Build it in this order and run it after each block:

1. `groups` and `books` (the shop's data).
2. The four auth tables (Better Auth needs them: `user`, `session`, `account`, `verification`).
3. `cart_items`, `wishlist_items`, `orders`, `order_items` (they reference `"user"` and `books` with foreign keys).
4. `newsletter_subscribers`, `contact_messages`.

`scripts/migrate.js` just reads the file and runs it: `npm run db:migrate`.

Checkpoint: Neon → **Tables** lists all 12 tables.
*Say it in plain English:* see section 3 of `docs/BACKEND.md`.

### Step 5: seed the data

`seed/catalog.js` is your old `books.js`. `scripts/seed.js` loops over it and inserts rows with
`insert ... on conflict (id) do update` (so you can run it again safely). Prices are stored in **cents**.

Checkpoint: `npm run db:seed`, then in Neon SQL Editor: `select title, price_cents from books order by position;` → 50 rows.

### Step 6: the first real API route

`src/routes/catalog.js`: `GET /api/groups`, `GET /api/books`, `GET /api/books/:id`.
Mount it in `index.js`: `app.use('/api', catalogRoutes)`.
Add `app.use(express.json())` before routes and an error handler at the end (`src/middleware.js`).

Checkpoint (in VS Code): open `server/requests.http`, click **Send Request** on "all books". You get JSON.
Then try the filtered and search requests.

### Step 7: authentication

1. `src/auth.js`: `betterAuth({ database: pool, secret, baseURL, trustedOrigins, emailAndPassword: { enabled: true } })`.
2. In `index.js`, **before** `express.json()`:
   `app.all('/api/auth/*splat', toNodeHandler(auth))`
3. `src/middleware.js`: `attachUser` (asks Better Auth who owns the cookie) and `requireAuth` (401 if nobody).

Checkpoint: in `requests.http`, send "protected route WITHOUT login" → **401**. (Real sign-up is tested from the website in Step 10.)

### Step 8: routes that need a user

Write them in this order, testing each one: `cart.js` → `wishlist.js` → `orders.js` → `forms.js`.
Mount with `app.use('/api/cart', attachUser, requireAuth, cartRoutes)`.
Always use `req.user.id`, never an id from the request body.

Checkpoint: once the frontend exists (Step 10), every button works; before that, 401 on all protected routes.

### Step 9: frontend foundations

1. `client/vite.config.js`: add `server: { proxy: { '/api': 'http://localhost:4000' } }`.
2. `client/src/lib/api.js`: one `fetch` helper that sends cookies and throws readable errors.
3. `client/src/context/CatalogContext.jsx`: loads `/api/groups` and `/api/books` once.
4. Replace every `import ... from '../data/books'` with `useCatalog()` (Header, Chooser, Hero, Footer, Marquee, FeatureBook, Contact, AudienceHero, OtherShelves, Main).
5. `Shelf.jsx`: fetch `/api/books?group=...` when the filter changes.

Checkpoint: the site looks exactly like before, but the books now come from the database.
Proof: in Neon change a price (`update books set price_cents = 999 where id = 'static';`), refresh the site → price changed.

### Step 10: login in the UI

1. `src/lib/authClient.js`: `createAuthClient({ baseURL: window.location.origin })`.
2. `src/context/ShopContext.jsx`: `authClient.useSession()` gives the current user.
3. `AuthDialog.jsx` (sign up / sign in form) and the Sign in / Sign out items in `Header.jsx`.

Checkpoint: sign up → header shows **My account / Sign out** → press **F5** → still signed in →
VS Code or Neon: `select email from "user";` shows your account → Sign out → header shows **Sign in**.
In the browser: DevTools → Application → Cookies → a `better-auth.session_token` cookie with **HttpOnly** ticked.

### Step 11: cart, wishlist, orders in the UI

`ShopContext` actions → `BookCard.jsx` (heart + Add to cart) → `CartDrawer.jsx` → `AccountPage.jsx`.
Checkpoint: add a book, change quantity, checkout, see it in **My account**; stock in Neon went down.
Try to buy more copies than exist → you get the "not enough copies" message and **no** order is created (transaction rolled back).

### Step 12: forms

`Newsletter.jsx` and `Contact.jsx` now `POST` to the API. Checkpoint: `select * from newsletter_subscribers;`.

### Step 13: commit (small commits, clear messages)

```bash
git add -A
git status                 # read the list! no .env files, no node_modules
git commit -m "Add Express API, Postgres schema and seed"
git push
```

Test your protection: `git check-ignore -v server/.env` prints the rule that ignores it.
Test again: `git ls-files | grep env` must show only `.env.example` files.
Use the **Source Control** panel (left sidebar, branch icon) if you prefer clicking; it shows the same list.

### Step 14: deploy

Follow section 7 of `docs/BACKEND.md` (Railway for `server/`, Vercel for `client/`, edit `client/vercel.json`, set `BETTER_AUTH_URL`).
Checkpoint on the **live URL**: sign up, refresh, add to cart, checkout.

---

## Debugging in VS Code

| Symptom | Likely cause and fix |
|---|---|
| `Missing environment variables: ...` | `.env` not in `server/`, or a value is empty. |
| `password authentication failed for user 'user'` | `.env` still has the placeholder from `.env.example`. Paste the real string from Neon (**Connect**, password visible). Other users/passwords: reset it in Neon (**Roles**). |
| `ENOTFOUND` | Typo in the host part of `DATABASE_URL`. Copy it again from Neon. |
| `relation "books" does not exist` | You forgot `npm run db:setup`. |
| `EADDRINUSE :4000` | An old server is still running. Close that terminal (trash icon) and start again. |
| Site says "We couldn't reach the shop" | Server not running, or the proxy target is wrong. Open `localhost:4000/api/health`. |
| Sign-up returns "Invalid origin" | `BETTER_AUTH_URL` / `CLIENT_ORIGINS` must equal the address in the browser bar (dev: `http://localhost:5173`). Restart the server after editing `.env`. |
| Sign-in works but a refresh logs you out | The API is being called on another domain. Use the `/api` proxy (dev) or the `vercel.json` rewrite (production). |
| Live site: first load takes seconds | Neon free database was asleep. Normal. |
| `401` on cart | You are signed out. The UI opens the sign-in dialog for you. |

Tools:
- **Server breakpoints:** Run and Debug panel → *JavaScript Debug Terminal* → run `npm run dev` there → click left of a line number to stop on it.
- **Network tab:** browser DevTools → Network → click a request to see status, JSON and cookies.
- **Database:** Neon SQL Editor, or the PostgreSQL extension inside VS Code.

## Everyday workflow

1. Start: **Run Everything** task.
2. Change code → browser reloads by itself; the server restarts by itself (`node --watch`).
3. Change `.env` → restart the server.
4. Change `schema.sql` → `npm run db:migrate` (it only adds missing things; to change an existing column write a new `alter table` statement).
5. Finished a feature → commit and push.

## Security habits

- Production gets its **own** `BETTER_AUTH_SECRET` (set in Railway, never in a file).
- If a secret is ever committed, **rotate it** (new Neon password, new secret). Deleting the file does not remove it from git history.
- Never put a `userId` in a request body to identify the user; the server reads it from the session.
