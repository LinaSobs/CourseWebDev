-- Research & Book page: normalised tables. Safe to run again ("if not exists" everywhere).
--
-- They live in their OWN Postgres schema called "research", so names like books / orders / order_items
-- never clash with the shop's tables in schema.sql (the kids/teens/adults shelves keep working untouched).
-- In queries you write research.books, research.orders ...

create schema if not exists research;

-- One person can write news AND papers, so authors get a table of their own and two join tables point at it.
create table if not exists research.authors (
  id           integer generated always as identity primary key,
  name         text not null unique,
  affiliation  text not null default ''
);

-- ---------------------------------------------------------------- NEWS
-- hero_image_url is a path under /assets of the 1200px WebP, e.g. research/news-gan-1200.webp.
-- The API derives the 480/800/1200 WebP + AVIF srcset from it (same name, different suffix).
create table if not exists research.news_articles (
  id              integer generated always as identity primary key,
  slug            text not null unique,
  title           text not null,
  summary         text not null,
  body            text not null,
  hero_image_url  text not null,
  hero_image_alt  text not null default '',
  author_id       integer not null references research.authors(id),   -- the byline (lead author)
  published_at    timestamptz not null,
  category        text not null,
  is_featured     boolean not null default false,
  -- full-text index: Postgres builds and keeps this column up to date by itself
  search          tsvector generated always as (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', summary || ' ' || category), 'B') ||
    setweight(to_tsvector('english', body), 'C')
  ) stored
);
create index if not exists news_published_idx on research.news_articles (published_at desc);
create index if not exists news_search_idx on research.news_articles using gin (search);
-- only one hero story at a time
create unique index if not exists news_one_featured_idx on research.news_articles (is_featured) where is_featured;

-- everyone credited on an article (the lead author is in here too)
create table if not exists research.news_article_authors (
  article_id  integer not null references research.news_articles(id) on delete cascade,
  author_id   integer not null references research.authors(id) on delete cascade,
  position    integer not null default 0,
  primary key (article_id, author_id)
);

-- ---------------------------------------------------------------- PAPERS
create table if not exists research.research_papers (
  id                integer generated always as identity primary key,
  title             text not null,
  abstract          text not null,
  doi               text unique,
  publication_date  date not null,
  journal_or_source text not null,
  difficulty_level  text not null check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  pdf_url           text not null,
  search            tsvector generated always as (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', abstract || ' ' || journal_or_source), 'B')
  ) stored
);
create index if not exists papers_level_idx on research.research_papers (difficulty_level, publication_date desc);
create index if not exists papers_search_idx on research.research_papers using gin (search);

create table if not exists research.research_paper_authors (
  paper_id   integer not null references research.research_papers(id) on delete cascade,
  author_id  integer not null references research.authors(id) on delete cascade,
  position   integer not null default 0,
  primary key (paper_id, author_id)
);

-- ---------------------------------------------------------------- BOOKS + ORDERS
create table if not exists research.books (
  id               integer generated always as identity primary key,
  slug             text not null unique,            -- also the cover file name: covers/<slug>.svg
  title            text not null,
  author           text not null,
  isbn             text not null unique,
  description      text not null,
  cover_image_url  text not null,
  price            numeric(10, 2) not null check (price > 0),   -- exact decimal, never a float
  difficulty_level text not null check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  stock_quantity   integer not null default 0 check (stock_quantity >= 0),   -- the database itself refuses negative stock
  category         text not null,
  search           tsvector generated always as (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('simple', author || ' ' || regexp_replace(isbn, '[^0-9Xx]', '', 'g')), 'A') ||
    setweight(to_tsvector('english', description || ' ' || category), 'B')
  ) stored
);
create index if not exists rbooks_level_idx on research.books (difficulty_level);
create index if not exists rbooks_search_idx on research.books using gin (search);

create table if not exists research.customers (
  id       integer generated always as identity primary key,
  name     text not null,
  email    text not null,
  address  text not null
);
-- one customer per email address (compared in lower case), so a repeat buyer is the same row
create unique index if not exists customers_email_idx on research.customers (lower(email));

create table if not exists research.orders (
  id           integer generated always as identity primary key,
  customer_id  integer not null references research.customers(id),
  order_date   timestamptz not null default now(),
  total_price  numeric(10, 2) not null check (total_price >= 0),
  status       text not null default 'placed'
);
create index if not exists rorders_customer_idx on research.orders (customer_id, order_date desc);

create table if not exists research.order_items (
  id          integer generated always as identity primary key,
  order_id    integer not null references research.orders(id) on delete cascade,
  book_id     integer not null references research.books(id),
  quantity    integer not null check (quantity between 1 and 10),
  unit_price  numeric(10, 2) not null,       -- price copied at purchase time (a receipt never changes)
  unique (order_id, book_id)
);
create index if not exists ritems_book_idx on research.order_items (book_id);

-- ---------------------------------------------------------------- imported news (added later, safe to re-run)
-- News pulled from a public API keeps a link back to the original story.
alter table research.news_articles add column if not exists source_url  text;
alter table research.news_articles add column if not exists source_name text;
create unique index if not exists news_source_url_idx on research.news_articles (source_url) where source_url is not null;
