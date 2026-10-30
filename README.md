# GlobalBooks

An online bookstore for every kind of reader, with shelves for kids, teens, students and scientists, a cart, real sign-in, and a **Research & Book** page with science news, research papers (with a built-in PDF viewer) and books to order.

Built for the CourseWebDev course (Assignment 3): React + Vite + Tailwind on the front end, an Express + Postgres JSON API on the back end.

---

## Features

### Shop

- **Shelves by reader group** (Kids, Teens, Students, ...). Each shelf has its own look, a hero, and a book grid with "More" paging (5 at a time).
- **Section drop-down.** The highlighted shelf tab opens its sections (Everything, Fiction, Non-fiction, ...) as an animated menu. Hover a tab with the mouse, or click or tap the highlighted tab on touch screens. The chosen section lives in the address bar (`?cat=fiction`), so filtered views can be bookmarked and shared.
- **Price filter, search, wishlist and cart drawer** with quantity steppers and an order total.
- **Purchased books** show up on your account page with a small looping animation.

### Accounts

- **Sign up, sign in and sign out** with email and password (Better Auth, secure session cookie, still signed in after a refresh).
- **Account page** with your profile (editable name, email status) and the books you own.
- The top bar groups the account links, the Night theme and Pin buttons, the cart and Contact into one tidy row. On phones they fold into the burger menu.

### Research & Book

- **Three panels:** Science News, Research Papers, Books. The open panel is kept in the address bar (`?section=research`).
- **Level filter** (Beginner / Intermediate / Advanced) under "Advanced search", sent to the server so only matching items come back.
- **Search everything** with `/` from anywhere on the page: results appear as you type, arrow keys move, Enter opens.
- **Featured paper** card with a drawn PDF page, stats strip, and a finder toolbar (search, sort, reading list).
- **PDF viewer:** a fixed-size window with the browser's own PDF viewer (zoom, search, print), Prev / Next paper, Cite, BibTeX and Save, plus Open in new tab, Download and DOI.
- **Reading list:** star papers to save them on this device (localStorage, no account needed).
- **Cite:** copy an APA citation from any paper card, or BibTeX from the viewer.
- **Order books** window with a cart, name, email and address form, and CSRF protection on the order request.

### Look and feel

- **Night theme** (toggle in the top bar) and a light theme, both built on CSS variables.
- **Calm animations.** Every duration is multiplied by one speed dial, `--dur-scale` in `src/styles/tokens.css` (`1` = fast, `1.75` = default, `2.5` = very slow).
- **Auto-hiding menu** that tucks away while you scroll down. Pin it with the pin button and it stays.
- **Motion Lab** page that explores the book-flip physics.

### Accessibility

- Keyboard-friendly dialogs (focus trap, Escape to close, focus returns to the button that opened them), skip-friendly headings, live regions for results and copy actions.
- Respects `prefers-reduced-motion`, `prefers-contrast` and forced colours.
- A `skin-reduce-fx` class on `<body>` switches off the heavy effects for slow devices.

---

## Tech stack

| Part      | Tools                                                        |
| --------- | ------------------------------------------------------------ |
| Front end | React, Vite, Tailwind CSS v4, plain CSS for tokens and pages |
| Routing   | A tiny hash router (`#/kids`, `#/account`, ...), no library  |
| Auth      | Better Auth (client in `src/lib/authClient.js`)              |
| API       | Express JSON API under `/api/...`                            |
| Database  | PostgreSQL (Neon)                                            |
| Hosting   | Vercel (front end) and Railway (back end)                    |

---

## Getting started

### 1. Requirements

- Node.js 20 or newer and npm
- A PostgreSQL database (a free Neon project works)

### 2. Install

```bash
git clone https://github.com/OsamaAlMomani/CourseWebDev.git
cd CourseWebDev

# front end
cd client
npm install

# back end (in a second terminal)
cd ../server
npm install
```

### 3. Environment variables

Copy `server/.env.example` to `server/.env` (or run `npm run setup`). `.env` files are never committed.

`server/.env`

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
BETTER_AUTH_SECRET=a-long-random-string
BETTER_AUTH_URL=http://localhost:5173
PORT=4000
CLIENT_ORIGINS=http://localhost:5173
```

`client/.env` (optional)

```env
# Leave empty in development: Vite forwards /api to the Express server.
# Set it only if the API lives on a different address.
VITE_API_URL=
```

### 4. Create and fill the database

```bash
cd server
npm run setup     # asks for your Neon string, writes .env, creates tables, loads books, papers and news
# (already have .env? use: npm run db:setup)
```

### 5. Run

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Open the address Vite prints (usually http://localhost:5173).


### Useful scripts

| Command                                   | What it does                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                             | Starts the dev server with hot reload                                        |
| `npm run build`                           | Makes the production build in `dist/`                                        |
| `npm run check:motion`                    | Runs the maths checks for the book-motion rules (`scripts/check-motion.mjs`) |
| `python scripts/generate-research-art.py` | Regenerates the research cover art                                           |

---

## Payments (Stripe Checkout, test mode)

Paying works like this. The browser never decides a price or an order's status.

1. **Pay with Stripe** in the cart calls `POST /api/checkout` (login required). The server reads the cart and the real prices from the database, saves an order as `pending` with its lines, and asks Stripe for a Checkout Session. The browser is sent to Stripe's hosted page.
2. The customer pays with the test card `4242 4242 4242 4242` (any future date, any CVC).
3. Stripe calls `POST /api/stripe/webhook`. The server verifies Stripe's signature, then sets the order to `paid`, takes the books off the shelf and empties them from the cart. **Nothing else in the project can mark an order paid.**
4. Stripe redirects the browser to `#/checkout/success?order=ID`. That page asks `GET /api/orders/ID` every 1.5 seconds (up to 10 times) until the webhook has made it `paid`.

Order status: `pending` (waiting for payment), `paid`, `expired` (Stripe session timed out or could not start), `demo` (old orders from before payments).

**Run it locally**

```bash
cd server
npm install stripe          # once; commit package.json and package-lock.json
npm run db:migrate          # adds the payment columns to orders
# put STRIPE_SECRET_KEY=sk_test_... in server/.env  (Stripe dashboard, Test mode ON, Developers, API keys)
stripe listen --forward-to localhost:4000/api/stripe/webhook
# it prints "whsec_..." : put that in server/.env as STRIPE_WEBHOOK_SECRET, then restart `npm run dev`
```

**On the live site:** in Stripe (Test mode) add a webhook endpoint `https://YOUR-BACKEND/api/stripe/webhook` listening to `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.expired`. Copy its signing secret into the backend's `STRIPE_WEBHOOK_SECRET`, and add `STRIPE_SECRET_KEY` there too. The webhook URL points at the backend directly, not through the frontend rewrite.

## Pages and addresses

The app uses hash routes, so it works on any static host without special rewrites.

| Address                                        | Page                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `#/`                                           | Home: hero, shelf chooser, featured book, perks, newsletter, contact |
| `#/kids`, `#/teens`, ...                       | One shelf per reader group                                           |
| `#/<shelf>?cat=fiction`                        | A shelf filtered to one section                                      |
| `#/scientists`                                 | Research & Book                                                      |
| `#/scientists?section=research&level=beginner` | Papers, beginner only                                                |
| `#/scientists?q=attention`                     | Opens the search with this text                                      |
| `#/account`                                    | Your account (sign in required)                                      |

---

## Project structure

```text
client/src/
  index.css          style entry point: only @import lines and the cascade order
  App.jsx            picks the page from the address
  layout/            Header, Footer, CartDrawer, AuthDialog, Toast, ChatFab, Main
  pages/             Home, Shelf, Account, Research, MotionLab (JSX and CSS together)
  shared/            parts used by several pages (PageHero, LoadMore, Button, ...)
  styles/            global CSS: tokens, night theme, animations, accessibility
  context/           Shop, Catalog and Skin state
  lib/               api helper, auth client, hooks (useRoute, useCategory, useSavedPapers, ...)
  data/              static data (themes, filters)
```

Full folder guide: `src/STRUCTURE.md`. Every CSS file starts with a header that says what it is for and lists its classes.

---

## Settings worth knowing

| What                      | Where                                                    |
| ------------------------- | -------------------------------------------------------- |
| Animation speed           | `--dur-scale` in `src/styles/tokens.css`                 |
| Colours, fonts, easing    | `@theme` and `:root` in `src/styles/tokens.css`          |
| Night theme colours       | `src/styles/theme-night.css`                             |
| Cards shown before "More" | `PAGE_SIZE` in `src/shared/LoadMore.jsx`                 |
| Section drop-down timing  | `FLY_CLOSE_DELAY` in `src/layout/Header/SlidingTabs.jsx` |
| Saved papers storage key  | `gb-saved-papers` in `src/lib/useSavedPapers.js`         |
| Pinned menu storage key   | `gb-header-pinned` (localStorage)                        |

---

## Deploying

1. **Back end on Railway.** Add the `server/` folder, set `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, and run the seed once.
2. **Front end on Vercel.** Deploy `client/`. `vercel.json` forwards `/api` to the Railway address, so the browser only talks to one origin and the login cookie stays first-party.
3. Set `BETTER_AUTH_URL` to the live front-end address.

---

## Troubleshooting

- **The PDF viewer shows nothing.** Some publishers forbid their PDFs inside a frame, and most phone browsers cannot show PDFs inline. Use "Open in new tab" or "Download" in the viewer footer.
- **Everything feels too slow or too fast.** Change `--dur-scale` in `tokens.css`.
- **You are signed out after every refresh.** Check that the front end and the API share one address (or that cookies are allowed across them) and that `BETTER_AUTH_URL` matches the site address.
- **The saved reading list is empty on another device.** It is stored in the browser, per device.

---

## Author

Osama Momani, M.Sc. Artificial Intelligence, Berlin School of Business & Innovation.
