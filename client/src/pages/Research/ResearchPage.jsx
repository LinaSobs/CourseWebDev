import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useResearchParams, { LEVELS, hrefFor } from '../../lib/useResearchParams'
import { fetchBooks, fetchNews, fetchPapers } from '../../lib/researchApi'
import { asset } from '../../lib/asset'
import Modal, { DialogBar } from './Modal'
import SearchModal from './SearchModal'
import OrderModal from './OrderModal'
import PaperViewer from './PaperViewer'
import PaperTools from './PaperTools'
import useSavedPapers from '../../lib/useSavedPapers'
import { BookCard, FeaturedPaper, LatestRow, NewsCard, NewsHero, PaperCard } from './cards'
import { Initial, NewsImage, formatDate, readingMinutes } from './bits'
import PageHero, { fanOf } from '../../shared/PageHero/PageHero'
import Container from '../../shared/Container'
import LoadMore, { useLoadMore } from '../../shared/LoadMore'
import AdvancedToggle from '../../shared/AdvancedToggle'

// The floating covers in the hero (they live in public/assets/research/covers)
const heroCovers = ['data-atlas', 'learning-machines', 'statistics-without-fear', 'causal-notebook', 'quantum-questions']

// ---------------------------------------------------------------- tiny data hook
// Loads something from the server, cancels the request if the page changes first, and exposes loading / error / retry.
function useLoad(load, deps, enabled = true) {
  const [state, setState] = useState({ status: 'loading', data: null })
  const [tries, setTries] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setState((s) => ({ ...s, status: 'loading' }))
    load(controller.signal)
      .then((data) => setState({ status: 'done', data }))
      .catch((err) => err.name !== 'AbortError' && setState({ status: 'error', data: null }))
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, tries])
  return { ...state, retry: () => setTries((t) => t + 1) }
}

// ---------------------------------------------------------------- layout pieces
// The three groups of the page. Each one is a big tab in the middle of the page and opens its own panel below it.
// (id is the value of ?section= in the address bar. "news" is the default when there is none.)
const GROUPS = [
  { id: 'news', icon: '📰', title: 'Science News', note: 'What is happening in science today' },
  { id: 'research', icon: '📄', title: 'Research Papers', note: 'The studies behind the headlines' },
  { id: 'books', icon: '📚', title: 'Books', note: 'What to read next, step by step' },
]

// How each difficulty level is introduced when a list is grouped by level
const LEVEL_INFO = {
  beginner: { title: 'Beginner', note: 'Start here. No background needed.' },
  intermediate: { title: 'Intermediate', note: 'A little maths or coding helps.' },
  advanced: { title: 'Advanced', note: 'For readers who like proofs and real research.' },
  other: { title: 'More', note: '' },
}

// The title of the open panel, a one-line intro, and (for papers and books) the level filter,
// which is tucked under an "Advanced search" button and opens only when asked.
function PanelHead({ id, title, intro, levelNav, activeCount = 0 }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-8 md:mb-10">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h2 id={id} className="t-section">
            {title}
          </h2>
          <p className="t-lede mt-3">{intro}</p>
        </div>
        {levelNav && <AdvancedToggle open={open} onToggle={() => setOpen((o) => !o)} count={activeCount} controls={`${id}-advanced`} />}
      </header>
      {levelNav && open && (
        <div id={`${id}-advanced`} className="skin-card mt-5 animate-rise-in p-4 motion-reduce:animate-none md:p-5">
          {levelNav}
        </div>
      )}
    </div>
  )
}

// One level (Beginner, Intermediate...) with its own small heading, its first 5 cards and a "More" button.
function LevelGroup({ kind, level, list, listClass, render, pinId, sig = '' }) {
  const page = useLoadMore(list, `${kind}|${level}|${sig}`, undefined, pinId)
  return (
    <section aria-labelledby={`${kind}-${level}-h`}>
      <div className="rs-group-head" data-level={level}>
        <h3 id={`${kind}-${level}-h`} className="t-title">
          {LEVEL_INFO[level].title}
        </h3>
        <span className="badge bg-skin-surface">{list.length}</span>
        {LEVEL_INFO[level].note && <p className="t-meta">{LEVEL_INFO[level].note}</p>}
      </div>
      <ul className={listClass}>
        {page.shown.map((item) => (
          <li key={item.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
            {render(item)}
          </li>
        ))}
      </ul>
      <LoadMore hasMore={page.hasMore} onMore={page.more} shown={page.shown.length} total={page.total} />
    </section>
  )
}

// Splits a list into Beginner / Intermediate / Advanced groups. Each group shows 5 and has its own "More".
// With a level picked there is just that one group.
function LevelGroups({ kind, items, level, listClass, render, pinId, sig }) {
  const groups = (level ? [level] : LEVELS)
    .map((l) => [l, items.filter((i) => i.difficulty_level === l)])
    .filter(([, list]) => list.length)
  const rest = items.filter((i) => !LEVELS.includes(i.difficulty_level))
  if (!level && rest.length) groups.push(['other', rest])
  return (
    <div className="grid gap-12 md:gap-14">
      {groups.map(([l, list]) => (
        <LevelGroup key={l} kind={kind} level={l} list={list} listClass={listClass} render={render} pinId={pinId} sig={sig} />
      ))}
    </div>
  )
}

// The news stories after the top story and the "Latest" box: 5 at first, then 5 more each time.
function MoreStories({ stories, onOpen }) {
  const page = useLoadMore(stories, 'news')
  return (
    <section aria-labelledby="more-news-h">
      <div className="rs-group-head">
        <h3 id="more-news-h" className="t-title">
          More stories
        </h3>
        <span className="badge bg-skin-surface">{stories.length}</span>
      </div>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
        {page.shown.map((a, i) => (
          <li key={a.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
            <NewsCard article={a} onOpen={onOpen} lazy={i > 2} />
          </li>
        ))}
      </ul>
      <LoadMore hasMore={page.hasMore} onMore={page.more} shown={page.shown.length} total={page.total} />
    </section>
  )
}

function Loading({ rows = 3 }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skin-card h-72 bg-sun/60 motion-safe:animate-pulse" />
      ))}
    </div>
  )
}

function Problem({ children, onRetry }) {
  return (
    <div role="alert" className="grid justify-items-start gap-3 rounded-3xl bg-coral/50 p-5 font-bold text-ink">
      <p>{children}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn skin-btn">
          Try again
        </button>
      )}
    </div>
  )
}

function Empty({ children, resetHref }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-3xl border-2 border-dashed border-line p-6">
      <p className="t-title">{children}</p>
      {resetHref && (
        <a href={resetHref} className="btn skin-btn skin-btn-soft">
          Show all levels →
        </a>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- article reader
// The story window: a sticky title bar, the picture, a meta row (author, date, minutes to read), the summary as a highlighted lead,
// then the story. The source button sits at the end of the story where you finish reading.
function ArticleModal({ article, onClose }) {
  return (
    <Modal label={article.title} onClose={onClose} className="md:max-w-3xl">
      <DialogBar title={article.category} onClose={onClose} />
      <article className="grid gap-5 pb-8">
        <NewsImage image={article.image} alt={article.hero_image_alt} eager sizes="(min-width: 768px) 48rem, 100vw" />
        <div className="grid gap-5 px-5 md:px-8">
          <h2 className="t-title md:text-4xl">{article.title}</h2>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-5 t-meta">
            <span className="flex items-center gap-2.5">
              <Initial name={article.authors[0]} />
              <span className="font-bold text-ink">{article.authors.join(', ')}</span>
            </span>
            <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(article.body)} min read</span>
          </p>
          <p className="t-lede max-w-none rounded-r-2xl border-l-[6px] border-coral bg-ink-soft/60 py-3 pr-4 pl-5 font-medium text-ink">{article.summary}</p>
          {article.body.split('\n\n').map((para, i) => (
            <p key={i} className="t-body max-w-[65ch] text-ink">
              {para}
            </p>
          ))}
          {article.source_url && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-soft/60 p-4">
              <p className="t-meta">Source: <span className="font-bold text-ink">{article.source_name}</span></p>
              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="btn skin-btn">
                Read the full story ↗<span className="sr-only"> at {article.source_name} (opens in a new tab)</span>
              </a>
            </div>
          )}
        </div>
      </article>
    </Modal>
  )
}

// ---------------------------------------------------------------- the page
export default function ResearchPage() {
  const [params, update] = useResearchParams()
  const { level } = params
  // one group is open at a time; no ?section= means the news
  const section = params.section || 'news'
  const group = GROUPS.find((g) => g.id === section)

  // The level filter is sent to the server: the database returns only matching papers / books.
  // Only the open group loads its list, so the page stays light.
  const news = useLoad((signal) => fetchNews(signal), [])
  const papers = useLoad((signal) => fetchPapers(level, signal), [level], section === 'research')
  const books = useLoad((signal) => fetchBooks({ level }, signal), [level], section === 'books')

  // dialogs
  const [searchOpen, setSearchOpen] = useState(() => params.q !== '')
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [article, setArticle] = useState(null)
  const [viewing, setViewing] = useState(null) // the paper open in the PDF viewer
  // paper finder: search words, sort order, "reading list only"
  const [pq, setPq] = useState('')
  const [sort, setSort] = useState('newest')
  const [onlySaved, setOnlySaved] = useState(false)
  const { saved, toggle: toggleSaved } = useSavedPapers()
  const [cart, setCart] = useState({})
  const [announce, setAnnounce] = useState('')
  const [flashPaper, setFlashPaper] = useState(null)
  const searchQuery = useRef(params.q)
  const cartCount = Object.values(cart).reduce((n, l) => n + l.quantity, 0)

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = () => {
    setSearchOpen(false)
    update({ q: '' }, { replace: true })
  }

  // "/" opens the search from anywhere on the page (like on most news sites), unless you are typing
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (el.closest?.('input, textarea, select, [contenteditable], [role=dialog]')) return
      e.preventDefault()
      openSearch()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openSearch])

  const addToCart = (book) => {
    setCart((c) => ({ ...c, [book.id]: { book, quantity: Math.min((c[book.id]?.quantity ?? 0) + 1, 10, book.stock_quantity) } }))
    setAnnounce(`${book.title} added to your order.`)
  }

  // When someone opens a search result: news opens the reader, a book opens the order window, a paper scrolls into view.
  const selectResult = (r, q) => {
    searchQuery.current = q
    setSearchOpen(false)
    update({ q: '' }, { replace: true })
    if (r.type === 'news') {
      const found = news.data?.find((a) => a.id === r.id)
      if (found) setArticle(found)
      else update({ section: 'news' })
    } else if (r.type === 'book') {
      setOrderSearch(r.title)
      setOrderOpen(true)
    } else {
      setFlashPaper(r.id)
      setPq('')
      setSort('newest')
      setOnlySaved(false)
      update({ section: 'research', level: level && level !== r.level ? '' : level })
    }
  }

  // after a paper was picked: wait until it is on the page, then scroll to it and move keyboard focus there
  useEffect(() => {
    if (!flashPaper || papers.status !== 'done') return
    const el = document.getElementById(`paper-${flashPaper}`)
    if (!el) return
    el.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    el.focus({ preventScroll: true })
    const t = setTimeout(() => setFlashPaper(null), 2500)
    return () => clearTimeout(t)
  }, [flashPaper, papers.status, papers.data])

  // the papers after search, reading-list filter and sort
  const paperList = useMemo(() => {
    const words = pq.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
    let list = papers.data ?? []
    if (onlySaved) list = list.filter((p) => saved.has(p.id))
    if (words.length) {
      list = list.filter((p) => {
        const hay = `${p.title} ${p.authors.join(' ')} ${p.abstract} ${p.journal_or_source ?? ''}`.normalize('NFKC').toLowerCase()
        return words.every((w) => hay.includes(w))
      })
    }
    const order = {
      newest: (a, b) => new Date(b.publication_date) - new Date(a.publication_date),
      oldest: (a, b) => new Date(a.publication_date) - new Date(b.publication_date),
      title: (a, b) => a.title.localeCompare(b.title),
    }[sort]
    return [...list].sort(order)
  }, [papers.data, pq, onlySaved, saved, sort])
  // the newest paper becomes the big featured card, unless you are searching / sorting / on your reading list
  const finding = pq.trim() !== '' || onlySaved || sort !== 'newest'
  const featured = !finding ? paperList[0] ?? null : null
  const restPapers = featured ? paperList.slice(1) : paperList
  const savedCount = (papers.data ?? []).filter((p) => saved.has(p.id)).length

  const link = (changes) => hrefFor({ section, level, ...changes })
  const articles = news.data ?? []
  const [hero, ...restNews] = articles.some((a) => a.is_featured) ? [articles.find((a) => a.is_featured), ...articles.filter((a) => !a.is_featured)] : articles
  const today = new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date())

  // the level filter, shown inside the Papers and Books panels only
  const levelNav = (
    <nav aria-label="Difficulty level" className="flex flex-wrap items-center gap-2">
      <span className="t-meta font-bold text-ink">Level</span>
      {[['', 'All'], ...LEVELS.map((l) => [l, l])].map(([value, label]) => (
        <a key={label} href={link({ level: value })} aria-current={level === value ? 'true' : undefined} className="chip capitalize">
          {label}
        </a>
      ))}
    </nav>
  )

  return (
    <div className="font-body text-ink">
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {/* ============================ 1. hero: the same PageHero as the home page and every shelf */}
      <PageHero
        kicker={today}
        title={<>Research <span className="text-blue">&amp;</span> Book</>}
        intro="Today’s science, the papers behind it, and the books to read next."
        covers={fanOf(heroCovers.map((id) => asset(`research/covers/${id}.svg`)), 95)}
        actions={
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={openSearch} aria-haspopup="dialog" className="btn btn-lg skin-btn">
              <span aria-hidden="true">⌕</span> Search everything
              <kbd aria-hidden="true" className="ml-1 hidden rounded-md bg-white/20 px-2 text-sm font-bold sm:block">/</kbd>
              <span className="sr-only">(press slash from anywhere on the page)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderSearch('')
                setOrderOpen(true)
              }}
              aria-haspopup="dialog"
              className="btn btn-lg skin-btn skin-btn-pop"
            >
              Order books
              {cartCount > 0 && (
                <span className="rounded-full bg-ink px-2 text-sm text-paper">
                  {cartCount}
                  <span className="sr-only"> in your order</span>
                </span>
              )}
            </button>
          </div>
        }
      />

      {/* ============================ 2. the three groups, as big tabs in the middle of the page */}
      <section aria-labelledby="explore-h" className="bg-paper pt-14 md:pt-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="explore-h" className="t-section">
              What would you like to explore?
            </h2>
            <p className="t-lede mx-auto mt-3">Pick a group. Each one opens its own page of things to read.</p>
          </div>
          <nav aria-label="Research groups" className="rs-tabs mt-8 md:mt-10">
            {GROUPS.map((g) => (
              <a key={g.id} href={hrefFor({ section: g.id, level: g.id === 'news' ? '' : level })} aria-current={section === g.id ? 'page' : undefined} className="rs-tab">
                <span className="rs-tab__icon" aria-hidden="true">{g.icon}</span>
                <span className="rs-tab__title">{g.title}</span>
                <span className="rs-tab__note">{g.note}</span>
              </a>
            ))}
          </nav>
        </Container>
      </section>

      {/* ============================ 3. the open group */}
      <section id="research-panel" aria-label={group.title} className="scroll-mt-32 bg-paper pt-12 pb-20 md:pt-16 md:pb-28">
        <Container>
          {/* ---- Science News: the top story, the latest list, then the rest */}
          {section === 'news' && (
            <>
              <PanelHead id="panel-h" title="Science News" intro="What is happening in science today." />
              {news.status === 'error' ? (
                <Problem onRetry={news.retry}>We couldn’t load the news.</Problem>
              ) : news.status === 'loading' && !articles.length ? (
                <Loading />
              ) : (
                <div className="grid gap-12 md:gap-14">
                  <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                    {hero && <NewsHero article={hero} onOpen={setArticle} />}
                    <div className="skin-card overflow-hidden">
                      <h3 className="t-title flex items-center gap-3 border-b border-line bg-ink-soft/60 px-5 py-4">
                        <span aria-hidden="true" className="size-2.5 rounded-full bg-coral motion-safe:animate-pulse" />
                        Latest
                      </h3>
                      {restNews.slice(0, 4).map((a, i) => (
                        <LatestRow key={a.id} index={i} kind="News" title={a.title} date={a.published_at} onClick={() => setArticle(a)} />
                      ))}
                      {!restNews.length && <p className="t-body p-5">Nothing new yet.</p>}
                    </div>
                  </div>
                  {restNews.length > 4 && <MoreStories stories={restNews.slice(4)} onOpen={setArticle} />}
                </div>
              )}
            </>
          )}

          {/* ---- Research Papers: grouped by level */}
          {section === 'research' && (
            <>
              <PanelHead id="panel-h" title="Research Papers" intro={level ? `Papers for ${level} readers.` : 'The papers behind the headlines, sorted by how hard they are.'} levelNav={levelNav} activeCount={level ? 1 : 0} />
              {papers.status === 'error' ? (
                <Problem onRetry={papers.retry}>We couldn’t load the papers.</Problem>
              ) : papers.status === 'loading' && !papers.data ? (
                <Loading rows={2} />
              ) : papers.data?.length === 0 ? (
                <Empty resetHref={link({ level: '' })}>No {level} papers yet.</Empty>
              ) : (
                <>
                  <PaperTools
                    papers={papers.data ?? []}
                    shown={paperList.length}
                    query={pq}
                    onQuery={setPq}
                    sort={sort}
                    onSort={setSort}
                    onlySaved={onlySaved}
                    onOnlySaved={setOnlySaved}
                    savedCount={savedCount}
                  />
                  {featured && (
                    <div className={`mb-12 md:mb-14 ${flashPaper === featured.id ? '[&_article]:bg-sun' : ''}`}>
                      <FeaturedPaper paper={featured} onView={setViewing} saved={saved.has(featured.id)} onToggleSave={toggleSaved} label={level ? 'Featured for this level' : 'Featured paper'} />
                    </div>
                  )}
                  {paperList.length === 0 ? (
                    <div className="grid justify-items-start gap-3 rounded-3xl border-2 border-dashed border-line p-6">
                      <p className="t-title">{onlySaved && !pq.trim() ? 'Your reading list is empty.' : 'No papers match.'}</p>
                      <p className="t-body">{onlySaved && !pq.trim() ? 'Tap the star on a paper to save it here.' : 'Try fewer words, or clear the search.'}</p>
                    </div>
                  ) : (
                    <LevelGroups
                      kind="paper"
                      sig={`${pq}|${sort}|${onlySaved}`}
                      pinId={flashPaper}
                      items={restPapers}
                      level={level}
                      listClass="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2"
                      render={(p) => (
                        <div className={flashPaper === p.id ? '[&_article]:bg-sun' : ''}>
                          <PaperCard paper={p} onView={setViewing} saved={saved.has(p.id)} onToggleSave={toggleSaved} />
                        </div>
                      )}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* ---- Books: grouped by level */}
          {section === 'books' && (
            <>
              <PanelHead id="panel-h" title="Books" intro={level ? `Books for ${level} readers.` : 'Books to read next, from first steps to proofs.'} levelNav={levelNav} activeCount={level ? 1 : 0} />
              {books.status === 'error' ? (
                <Problem onRetry={books.retry}>We couldn’t load the books.</Problem>
              ) : books.status === 'loading' && !books.data ? (
                <Loading />
              ) : books.data?.length === 0 ? (
                <Empty resetHref={link({ level: '' })}>No {level} books yet.</Empty>
              ) : (
                <LevelGroups
                  kind="book"
                  items={books.data ?? []}
                  level={level}
                  listClass="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3"
                  render={(b) => <BookCard book={b} inCart={cart[b.id]?.quantity ?? 0} onAdd={addToCart} />}
                />
              )}
            </>
          )}
        </Container>
      </section>

      {/* ============================ dialogs */}
      {searchOpen && (
        <SearchModal
          initialQuery={params.q}
          initialType={params.type}
          initialLevel={level}
          onQueryChange={(q) => {
            searchQuery.current = q
            update({ q }, { replace: true })
          }}
          onClose={closeSearch}
          onSelect={selectResult}
        />
      )}
      {orderOpen && <OrderModal cart={cart} setCart={setCart} initialSearch={orderSearch} onClose={() => { setOrderOpen(false); books.retry() }} />}
      {article && <ArticleModal article={article} onClose={() => setArticle(null)} />}
      {viewing && <PaperViewer paper={viewing} list={featured ? [featured, ...restPapers] : restPapers} saved={saved} onToggleSave={toggleSaved} onClose={() => setViewing(null)} />}
    </div>
  )
}
