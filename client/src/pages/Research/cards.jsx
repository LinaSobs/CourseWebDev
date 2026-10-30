import { useState } from 'react'
import { asset } from '../../lib/asset'
import { Initial, LevelBadge, NewsImage, PdfIcon, citeApa, formatDate, money, readingMinutes, safeHttpUrl, stockInfo, useCopy } from './bits'

// Every card here is a normal .skin-card (same radius, border and shadow as the book cards on the shelves),
// every button is a .skin-btn, every title uses the .t-* scale. The extra look (colour bar, zoom, tiles) lives in Research.css.

const ZOOM = 'transition-transform duration-[calc(600ms*var(--dur-scale))] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100'

// ------------------------------------------------------------------ news
export function NewsHero({ article, onOpen }) {
  return (
    <article className="skin-card group overflow-hidden">
      <div className="relative overflow-hidden">
        <NewsImage image={article.image} alt={article.hero_image_alt} eager sizes="(min-width: 1024px) 58vw, 100vw" className={ZOOM} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink/50 to-transparent" />
        <p className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="badge bg-coral shadow-sm">Top story</span>
          <span className="badge bg-sun shadow-sm">{article.category}</span>
        </p>
      </div>
      <div className="grid gap-4 p-5 md:p-8">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 t-meta">
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingMinutes(article.body)} min read</span>
        </p>
        <h3 className="t-title md:text-4xl">
          <button type="button" onClick={() => onOpen(article)} className="text-left underline-offset-8 hover:underline">
            {article.title}
          </button>
        </h3>
        <p className="t-lede max-w-[60ch]">{article.summary}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="flex items-center gap-3 t-meta">
            <Initial name={article.authors[0]} />
            <span>By {article.authors.join(', ')}</span>
          </p>
          <button type="button" onClick={() => onOpen(article)} className="btn skin-btn">
            Read the story <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export function NewsCard({ article, onOpen, lazy = true }) {
  return (
    <article className={`skin-card card-lift group relative flex flex-col overflow-hidden focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue ${lazy ? 'rb-lazy' : ''}`}>
      <div className="relative overflow-hidden">
        <NewsImage image={article.image} alt={article.hero_image_alt} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" className={ZOOM} />
        <span className="badge absolute top-3 left-3 bg-sun shadow-sm">{article.category}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 t-meta">
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingMinutes(article.body)} min read</span>
        </p>
        {/* the whole card is the click target: the title button stretches over it */}
        <h3 className="t-card-title">
          <button type="button" onClick={() => onOpen(article)} className="text-left outline-none after:absolute after:inset-0 after:content-[''] group-hover:underline group-hover:underline-offset-4">
            {article.title}
          </button>
        </h3>
        <p className="t-body line-clamp-3">{article.summary}</p>
        <p className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 t-meta">
          <span className="flex min-w-0 items-center gap-2.5">
            <Initial name={article.authors[0]} className="size-7 text-xs" />
            <span className="truncate">{article.authors.join(', ')}</span>
          </span>
          <span aria-hidden="true" className="font-bold text-blue transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </article>
  )
}

// small headline row for the "latest" column next to the hero
export function LatestRow({ kind, title, date, onClick, href, external, index }) {
  const inner = (
    <>
      {index !== undefined && (
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-soft font-display text-base font-extrabold text-blue">
          {index + 1}
        </span>
      )}
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="flex items-center gap-2 t-meta">
          <span className={`badge ${kind === 'Paper' ? 'bg-mint' : 'bg-sun'}`}>{kind}</span>
          <time dateTime={date}>{formatDate(date)}</time>
        </span>
        <span className="t-card-title text-[1.05rem] leading-snug md:text-[1.15rem] group-hover:underline">{title}</span>
      </span>
      <span aria-hidden="true" className="font-bold text-blue transition-transform group-hover:translate-x-1">→</span>
    </>
  )
  const cls = 'group flex items-center gap-3 border-b border-line px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-sun/40'
  return href ? (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={`${cls} w-full`}>
      {inner}
    </button>
  )
}

// ------------------------------------------------------------------ papers
// A paper card looks like a small document: a colour bar for the level, a PDF tile, the title, a short abstract
// (tap "Read more" for all of it) and a footer with View PDF, Open and DOI.
export function PaperCard({ paper, onView, saved = false, onToggleSave }) {
  const [more, setMore] = useState(false)
  const [done, copy] = useCopy()
  const pdf = safeHttpUrl(paper.pdf_url)
  const long = paper.abstract.length > 280
  return (
    <article
      id={`paper-${paper.id}`}
      tabIndex={-1}
      data-level={paper.difficulty_level}
      className="rs-paper skin-card card-lift rb-lazy flex scroll-mt-28 flex-col overflow-hidden target:bg-sun"
    >
      <span aria-hidden="true" className="rs-paper__bar" />
      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <PdfIcon />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={paper.difficulty_level} />
              {paper.journal_or_source && <span className="badge bg-ink/10">{paper.journal_or_source}</span>}
            </div>
            <p className="mt-2 t-meta">
              Published <time dateTime={paper.publication_date}>{formatDate(paper.publication_date)}</time>
            </p>
          </div>
          {onToggleSave && <SaveStar saved={saved} title={paper.title} onClick={() => onToggleSave(paper.id)} />}
        </div>

        <h3 className="t-card-title">{paper.title}</h3>
        <p className="flex items-start gap-2 t-meta">
          <span aria-hidden="true">✍️</span>
          <span className="line-clamp-2">{paper.authors.join(', ')}</span>
        </p>

        <div className="rounded-2xl bg-ink-soft/60 p-4">
          <p className="mb-1.5 text-xs font-extrabold tracking-widest text-ink/70 uppercase">Abstract</p>
          <p id={`abstract-${paper.id}`} className={`t-body text-[0.97rem] ${more ? '' : 'line-clamp-4'}`}>
            {paper.abstract}
          </p>
          {long && (
            <button
              type="button"
              aria-expanded={more}
              aria-controls={`abstract-${paper.id}`}
              onClick={() => setMore((m) => !m)}
              className="mt-2 text-sm font-bold text-blue underline-offset-4 hover:underline"
            >
              {more ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2.5 border-t border-line pt-4">
          {pdf ? (
            <>
              <button type="button" onClick={() => onView(paper)} aria-haspopup="dialog" className="btn skin-btn">
                <span aria-hidden="true">👁</span> View PDF<span className="sr-only"> of {paper.title}</span>
              </button>
              <a href={pdf} target="_blank" rel="noopener noreferrer" className="btn skin-btn skin-btn-soft">
                Open<span className="sr-only"> {paper.title} (opens in a new tab)</span> <span aria-hidden="true">↗</span>
              </a>
            </>
          ) : (
            <p className="badge bg-ink/10 px-3 py-1.5">PDF not available yet</p>
          )}
          <button type="button" onClick={() => copy(citeApa(paper), 'Citation')} className="btn skin-btn skin-btn-soft">
            {done ? 'Copied ✓' : 'Cite'}
            <span className="sr-only"> {paper.title} (copies the citation)</span>
          </button>
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="btn skin-btn skin-btn-soft ml-auto">
              DOI<span className="sr-only"> of {paper.title} (opens in a new tab)</span> <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
        <p role="status" className="sr-only">{done && 'Citation copied to the clipboard.'}</p>
      </div>
    </article>
  )
}

// the star that adds a paper to your reading list (kept on this device, see lib/useSavedPapers.js)
export function SaveStar({ saved, title, onClick, className = '' }) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={onClick}
      title={saved ? 'Saved. Click to remove it from your reading list.' : 'Save to your reading list'}
      className={`grid size-11 shrink-0 place-items-center rounded-full border text-xl transition-colors ${saved ? 'border-sun bg-sun text-ink' : 'border-line text-ink/60 hover:bg-sun/60 hover:text-ink'} ${className}`}
    >
      <span aria-hidden="true">{saved ? '★' : '☆'}</span>
      <span className="sr-only">{saved ? `Remove ${title} from your reading list` : `Save ${title} to your reading list`}</span>
    </button>
  )
}

// The paper of the moment: a big card above the list, with a drawn "page" of the PDF, the abstract and every action.
export function FeaturedPaper({ paper, onView, saved, onToggleSave, label = 'Featured paper' }) {
  const [done, copy] = useCopy()
  const pdf = safeHttpUrl(paper.pdf_url)
  return (
    <article
      id={`paper-${paper.id}`}
      tabIndex={-1}
      data-level={paper.difficulty_level}
      className="rs-paper rs-featured skin-card rb-lazy grid scroll-mt-28 overflow-hidden target:bg-sun lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
    >
      <div className="rs-featured__stage" aria-hidden="true">
        <div className="rs-sheet">
          <span className="rs-sheet__title" />
          <span className="rs-sheet__title w-2/3" />
          <span className="rs-sheet__lines" />
          <span className="rs-sheet__stamp">PDF</span>
        </div>
      </div>
      <div className="grid content-center gap-4 p-6 md:p-10">
        <p className="flex flex-wrap items-center gap-2">
          <span className="badge bg-coral shadow-sm">⭐ {label}</span>
          <LevelBadge level={paper.difficulty_level} />
          {paper.journal_or_source && <span className="badge bg-ink/10">{paper.journal_or_source}</span>}
        </p>
        <h3 className="t-title md:text-4xl">{paper.title}</h3>
        <p className="t-meta">
          {paper.authors.join(', ')} · <time dateTime={paper.publication_date}>{formatDate(paper.publication_date)}</time>
        </p>
        <p className="t-body line-clamp-5 max-w-[65ch]">{paper.abstract}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          {pdf && (
            <button type="button" onClick={() => onView(paper)} aria-haspopup="dialog" className="btn btn-lg skin-btn">
              <span aria-hidden="true">👁</span> View PDF<span className="sr-only"> of {paper.title}</span>
            </button>
          )}
          <button type="button" onClick={() => copy(citeApa(paper), 'Citation')} className="btn skin-btn skin-btn-soft">
            {done ? 'Copied ✓' : 'Cite'}
            <span className="sr-only"> {paper.title} (copies the citation)</span>
          </button>
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="btn skin-btn skin-btn-soft">
              DOI<span className="sr-only"> of {paper.title} (opens in a new tab)</span> <span aria-hidden="true">↗</span>
            </a>
          )}
          {onToggleSave && <SaveStar saved={saved} title={paper.title} onClick={() => onToggleSave(paper.id)} />}
        </div>
        <p role="status" className="sr-only">{done && 'Citation copied to the clipboard.'}</p>
      </div>
    </article>
  )
}

// ------------------------------------------------------------------ books
export function BookCard({ book, inCart, onAdd }) {
  const stock = stockInfo(book.stock_quantity)
  const out = book.stock_quantity <= 0
  return (
    <article id={`book-${book.slug}`} className="skin-card card-lift rb-lazy group flex flex-col overflow-hidden">
      <div className="relative grid place-items-center bg-linear-to-br from-ink-soft via-paper to-coral/25 px-5 pt-14 pb-7">
        <span className="absolute top-4 left-4">
          <LevelBadge level={book.difficulty_level} className="shadow-sm" />
        </span>
        {book.category && <span className="badge absolute top-4 right-4 max-w-[45%] truncate bg-skin-surface/90 shadow-sm">{book.category}</span>}
        <img
          src={asset(book.cover_image_url)}
          alt={`Cover of ${book.title}`}
          width="300"
          height="400"
          loading="lazy"
          decoding="async"
          className="aspect-[3/4] w-3/5 max-w-[210px] rounded-xl object-cover shadow-[0_18px_36px_rgba(18,38,63,0.22)] transition-transform duration-[calc(400ms*var(--dur-scale))] ease-out group-hover:-rotate-2 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="t-card-title">{book.title}</h3>
        <p className="t-meta">by {book.author}</p>
        <p className="t-body line-clamp-3">{book.description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="font-display text-3xl font-extrabold tracking-tight text-blue">{money(book.price)}</p>
          <p className={`badge ${stock.cls}`}>{stock.label}</p>
        </div>
        <button type="button" disabled={out} onClick={() => onAdd(book)} className="btn skin-btn mt-2 w-full">
          {out ? 'Sold out' : inCart ? `Add another (${inCart} in order)` : 'Add to order'}
          <span className="sr-only"> — {book.title}</span>
        </button>
      </div>
    </article>
  )
}
