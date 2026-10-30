-- GlobalBooks database schema (PostgreSQL). Safe to run again: everything is "if not exists".
-- Read it top to bottom: auth tables, then the shop's own tables, then what users do (cart, wishlist, orders).

-- ============================================================================================
-- 1) AUTH TABLES - owned by Better Auth (the auth library). We never write to these by hand.
--    "user" = one row per person. "account" = how they log in (their password hash lives here).
--    "session" = one row per logged-in browser. "verification" = tokens for email checks (unused for now).
-- ============================================================================================
create table if not exists "user" (
  id               text primary key,
  name             text not null,
  email            text not null unique,
  "emailVerified"  boolean not null default false,
  image            text,
  "createdAt"      timestamptz not null default now(),
  "updatedAt"      timestamptz not null default now()
);

create table if not exists session (
  id           text primary key,
  "expiresAt"  timestamptz not null,
  token        text not null unique,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now(),
  "ipAddress"  text,
  "userAgent"  text,
  "userId"     text not null references "user"(id) on delete cascade
);

create table if not exists account (
  id                       text primary key,
  "accountId"              text not null,
  "providerId"             text not null,
  "userId"                 text not null references "user"(id) on delete cascade,
  "accessToken"            text,
  "refreshToken"           text,
  "idToken"                text,
  "accessTokenExpiresAt"   timestamptz,
  "refreshTokenExpiresAt"  timestamptz,
  scope                    text,
  password                 text,
  "createdAt"              timestamptz not null default now(),
  "updatedAt"              timestamptz not null default now()
);

create table if not exists verification (
  id           text primary key,
  identifier   text not null,
  value        text not null,
  "expiresAt"  timestamptz not null,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);

create index if not exists session_user_idx on session ("userId");
create index if not exists account_user_idx on account ("userId");

-- ============================================================================================
-- 2) THE SHOP - what we sell. Replaces the old hardcoded src/data/books.js
-- ============================================================================================

-- A "reader group" (kids, teens, adults, students, scientists). Each one is a page on the site.
create table if not exists groups (
  id          text primary key,            -- 'kids' - also used in the URL (#/kids)
  world       text not null default 'general',  -- which half of the shop: 'kids' (the Kids Corner) or 'general' (teens to scientists)
  categories  jsonb not null default '[]',      -- the sections inside this shelf: [{ id, label, icon }]
  position    integer not null,            -- order in the menu
  title       text not null,
  home_line   text not null,
  kicker      text not null,
  headline    text not null,
  intro       text not null,
  cta         text not null,
  shelf_title text not null,
  shelf_note  text not null,
  points      jsonb not null default '[]'  -- the 3 small promises, always shown together, so a JSON list is enough
);

-- One book. Money is stored in CENTS (integer) because decimals like 12.99 can drift in floating point.
create table if not exists books (
  id           text primary key,           -- slug, also the cover file name: covers/<id>.svg
  group_id     text not null references groups(id),
  position     integer not null default 0,     -- order inside the shelf (matches the old array order)
  title        text not null,
  author       text not null,
  detail       text not null,              -- 'Ages 3-6', 'Fiction', ...
  category     text not null default '',   -- one of the group's categories ('bedtime', 'fiction', ...)
  age_min      integer,                    -- kids' books only: youngest and oldest age it suits
  age_max      integer,
  blurb        text not null,
  price_cents  integer not null check (price_cents > 0),
  is_new       boolean not null default false,
  is_featured  boolean not null default false,   -- "book of the month"
  stock        integer not null default 25 check (stock >= 0),
  created_at   timestamptz not null default now()
);
create index if not exists books_group_idx on books (group_id);

-- If you made your tables with an older version of this file, these add the new columns. They do nothing on a fresh database.
alter table groups add column if not exists world text not null default 'general';
alter table groups add column if not exists categories jsonb not null default '[]';
alter table books add column if not exists category text not null default '';
alter table books add column if not exists age_min integer;
alter table books add column if not exists age_max integer;
create index if not exists books_category_idx on books (group_id, category);
-- only one book can be "book of the month" at a time
create unique index if not exists books_one_featured_idx on books (is_featured) where is_featured;

-- ============================================================================================
-- 3) WHAT SIGNED-IN USERS DO
--    Pattern: a row belongs to a user ("userId" foreign key). If the user is deleted, their rows go too.
-- ============================================================================================

-- The shopping cart. One row per (user, book); the composite primary key makes "same book twice" impossible.
create table if not exists cart_items (
  user_id   text not null references "user"(id) on delete cascade,
  book_id   text not null references books(id) on delete cascade,
  quantity  integer not null check (quantity between 1 and 10),
  primary key (user_id, book_id)
);

-- Saved-for-later list ("heart" button).
create table if not exists wishlist_items (
  user_id     text not null references "user"(id) on delete cascade,
  book_id     text not null references books(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- An order header + its lines. Lines COPY the title and price at purchase time (a "snapshot"),
-- so changing a book's price tomorrow never rewrites yesterday's receipt.
--
-- Payments (Stripe Checkout, test mode). An order starts as 'pending' when the customer clicks Pay.
-- ONLY the Stripe webhook (server/src/routes/stripeWebhook.js) may change it to 'paid'.
--   pending -> paid      Stripe confirmed the payment
--   pending -> expired   the customer never paid and the Stripe session timed out
--   demo                 orders made before payments existed (the old "no payment" demo checkout)
create table if not exists orders (
  id                 integer generated always as identity primary key,
  user_id            text not null references "user"(id) on delete cascade,
  total_cents        integer not null check (total_cents >= 0),
  status             text not null default 'pending',
  ship_name          text not null,
  ship_address       text not null,
  ship_country       text not null,
  stripe_session_id  text unique,   -- the Checkout Session this order is paid through
  stripe_payment_id  text,          -- Stripe's PaymentIntent id (a receipt you can look up in the Stripe dashboard)
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);

-- If the table already existed (older database), bring it up to date. Safe to run again and again.
alter table orders add column if not exists stripe_session_id text unique;
alter table orders add column if not exists stripe_payment_id text;
alter table orders add column if not exists paid_at timestamptz;
alter table orders alter column status set default 'pending';
update orders set status = 'demo' where status = 'placed';
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in ('pending', 'paid', 'expired', 'demo'));
create index if not exists orders_user_idx on orders (user_id, created_at desc);

create table if not exists order_items (
  order_id          integer not null references orders(id) on delete cascade,
  book_id           text not null references books(id),
  title             text not null,
  unit_price_cents  integer not null,
  quantity          integer not null check (quantity > 0),
  primary key (order_id, book_id)
);

-- ============================================================================================
-- 4) FORMS - what visitors send us (no login needed)
-- ============================================================================================
create table if not exists newsletter_subscribers (
  email       text primary key,            -- stored lowercase; primary key = no duplicates
  created_at  timestamptz not null default now()
);

create table if not exists contact_messages (
  id          integer generated always as identity primary key,
  user_id     text references "user"(id) on delete set null,   -- optional: filled if they were signed in
  topic       text not null,
  name        text not null,
  email       text not null,
  details     jsonb not null default '{}',  -- the topic-specific fields (budget, order number, ...)
  message     text not null default '',
  created_at  timestamptz not null default now()
);
