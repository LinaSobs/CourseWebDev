import { useEffect, useMemo, useState } from 'react'
import { priceFilters, ageFilters } from '../../data/filters'
import { useCatalog } from '../../context/CatalogContext'
import { voices } from '../../data/themes'
import { api } from '../../lib/api'
import BookCard from './BookCard'
import Container from '../../shared/Container'
import Decor from './Decor'
import PriceFilter from './PriceFilter'
import LoadMore, { useLoadMore } from '../../shared/LoadMore'
import AdvancedToggle from '../../shared/AdvancedToggle'

// The main grid of one reader group, with price filter + search on top.
// The books come from the API: every time the filter or search changes we ask the server again (?group=&min=&max=&q=).
export default function Shelf({ group, theme, category, onCategory }) {
  const { books: allBooks } = useCatalog()
  const isKids = group.world === 'kids'
  // kids shop by age, everyone else by price
  const filterOptions = isKids ? ageFilters : priceFilters
  const total = allBooks.filter((b) => b.group === group.id && (category === 'all' || b.category === category)).length
  const [priceId, setPriceId] = useState('any')
  const [search, setSearch] = useState('') // what is typed in the box
  const [sort, setSort] = useState('featured') // how the books are ordered (done here, no new API call needed)
  const [q, setQ] = useState('') // the same text, but only updated after a short pause (so we don't call the API on every key)
  const [result, setResult] = useState({ status: 'loading', books: [] })
  const [advOpen, setAdvOpen] = useState(false) // the "Advanced search" panel (sort, sections, price / age) starts closed

  useEffect(() => {
    const id = window.setTimeout(() => setQ(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    const range = filterOptions.find((f) => f.id === priceId)
    const params = new URLSearchParams({ group: group.id })
    if (category !== 'all') params.set('category', category)
    // the same two numbers mean a price range on most shelves and an age range in the Kids Corner
    if (range.min !== null) params.set(isKids ? 'ageFrom' : 'min', range.min)
    if (range.max !== null) params.set(isKids ? 'ageTo' : 'max', range.max)
    if (q) params.set('q', q)

    // AbortController cancels the previous request if a newer one starts, so slow old answers can't overwrite new ones
    const controller = new AbortController()
    setResult((r) => ({ ...r, status: 'loading' }))
    api(`/books?${params}`, { signal: controller.signal })
      .then((books) => {
        setResult({ status: 'ready', books })
      })
      .catch((err) => err.name !== 'AbortError' && setResult({ status: 'error', books: [] }))
    return () => controller.abort()
  }, [group.id, category, priceId, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const voice = voices[group.id] ?? voices.home

  // the server sends the books in shelf order; sorting just rearranges what we already have
  const visible = useMemo(() => {
    const list = [...result.books]
    if (sort === 'low') list.sort((a, b) => a.price - b.price)
    if (sort === 'high') list.sort((a, b) => b.price - a.price)
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'new') list.sort((a, b) => Number(b.isNew) - Number(a.isNew))
    return list
  }, [result.books, sort])

  // only 5 cards at first; each press of "More" adds 5. Going back to 5 whenever the filter, search, section or sort changes.
  const page = useLoadMore(visible, `${group.id}|${category}|${priceId}|${q}|${sort}`)

  // how many of the filters inside the panel are on (shown as a number on the button while the panel is closed)
  const activeFilters = Number(sort !== 'featured') + Number(category !== 'all') + Number(priceId !== 'any')

  function resetFilters() {
    setPriceId('any')
    setSort('featured')
    onCategory('all')
  }

  function clearAll() {
    setSearch('')
    setPriceId('any')
    setSort('featured')
    onCategory('all')
  }

  return (
    <section
      id="shelf"
      className={`relative isolate overflow-hidden py-16 md:py-28 ${theme.font} ${theme.shelfBg} ${theme.shelfPattern}`}
    >
      <Decor />
      <Container className="relative z-10">
        <header className="reveal mb-8 md:mb-10">
          <h2 className={theme.shelfHeading}>{group.shelfTitle}</h2>
          <p className={`mt-3 ${theme.shelfNote}`}>{group.shelfNote}</p>
        </header>

        {/* the search box stays in sight; sort, sections and price / age are tucked under "Advanced search" */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="block w-full max-w-md">
            <span className="sr-only">Search this shelf by title or author</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or author"
              className="skin-input min-h-12 w-full rounded-full px-5 text-lg"
            />
          </label>
          <AdvancedToggle open={advOpen} onToggle={() => setAdvOpen((o) => !o)} count={activeFilters} controls="shelf-advanced" />
          <p aria-live="polite" className={`sm:ml-auto ${theme.filterCount}`}>
            Showing {visible.length} of {Math.max(total, visible.length)} books
          </p>
        </div>

        {advOpen && (
          <div id="shelf-advanced" className="skin-card mb-8 grid animate-rise-in gap-5 p-5 motion-reduce:animate-none md:mb-10 md:p-6">
            <label className="flex flex-wrap items-center gap-3">
              <span className={theme.filterLabel}>Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="skin-input min-h-12 rounded-full px-5 text-lg"
              >
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="az">Title: A to Z</option>
                <option value="new">New first</option>
              </select>
            </label>

            {/* sections of this shelf: Bedtime, Fiction, Study guides... */}
            {group.categories.length > 0 && (
              <div role="group" aria-label="Sections" className="flex flex-wrap gap-2">
                {[{ id: 'all', label: 'Everything' }, ...group.categories].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={category === c.id}
                    onClick={() => onCategory(c.id)}
                    className="chip"
                  >
                    {c.icon && <span aria-hidden="true" className="mr-1.5">{c.icon}</span>}
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            <PriceFilter
              compact
              selected={priceId}
              onChange={setPriceId}
              shown={visible.length}
              total={Math.max(total, visible.length)}
              theme={theme}
              options={filterOptions}
              label={isKids ? 'How old is the reader?' : 'Filter by price'}
            />

            {activeFilters > 0 && (
              <button type="button" onClick={resetFilters} className="chip w-fit">
                Reset filters
              </button>
            )}
          </div>
        )}

        {result.status === 'error' ? (
          <p role="alert" className={`py-6 ${theme.shelfNote}`}>We couldn’t load the books. Please refresh in a moment.</p>
        ) : result.status === 'loading' && visible.length === 0 ? (
          // grey placeholder cards in this shelf's own card style, so the page doesn't jump when the books arrive
          <div role="status" aria-label="Loading books" className="grid gap-5 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-8">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className={`overflow-hidden ${theme.card}`}>
                <div className="aspect-[200/270] animate-pulse bg-current/10 motion-reduce:animate-none" />
                <div className="grid gap-3 p-5">
                  <div className="h-6 w-3/4 animate-pulse rounded bg-current/10 motion-reduce:animate-none" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-current/10 motion-reduce:animate-none" />
                  <div className="h-12 animate-pulse rounded-full bg-current/10 motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="grid justify-items-start gap-4 py-6">
            <p className={theme.shelfNote}>
              <span aria-hidden="true" className="mr-2">{voice.icon}</span>
              {voice.noResults}
            </p>
            <button type="button" onClick={clearAll} className={theme.order}>
              {voice.clear}
            </button>
          </div>
        ) : (
          // phones: one swipeable row that bleeds to the screen edge. sm and up: a normal grid
          <div className={`-mx-[var(--gutter)] flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-px-[var(--gutter)] px-[var(--gutter)] pt-1 pb-6 transition-opacity [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] sm:overflow-visible sm:px-0 md:gap-8 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] [&::-webkit-scrollbar]:hidden ${result.status === 'loading' ? 'opacity-60' : ''}`}>
            {page.shown.map((book) => (
              <BookCard key={book.id} book={book} theme={theme} />
            ))}
          </div>
        )}
        {result.status !== 'error' && <LoadMore hasMore={page.hasMore} onMore={page.more} shown={page.shown.length} total={page.total} />}
      </Container>
    </section>
  )
}
