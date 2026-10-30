import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import { Highlight, LevelBadge } from './bits'
import { searchAll } from '../../lib/researchApi'
import { LEVELS } from '../../lib/useResearchParams'

const TYPE_OPTIONS = [
  ['', 'All'],
  ['news', 'News'],
  ['paper', 'Papers'],
  ['book', 'Books'],
]
const TYPE_LABEL = { news: 'News', paper: 'Paper', book: 'Book' }
const TYPE_ICON = { news: '📰', paper: '📄', book: '📚' }

// Cuts a long text down to ~150 characters around the first word you searched for.
function excerpt(text, query) {
  if (text.length <= 150) return text
  const word = (query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])[0]
  const at = word ? text.toLowerCase().indexOf(word) : -1
  const start = Math.max(0, (at < 0 ? 0 : at) - 40)
  return `${start > 0 ? '…' : ''}${text.slice(start, start + 150).trim()}…`
}

// Focus-mode search: opens full-width over a dimmed page, the input is focused, results appear while you type.
//   - typing waits 300 ms (debounce) so we don't send a request for every key
//   - a newer request cancels the older one (AbortController), so slow old answers can never overwrite new ones
//   - ArrowUp / ArrowDown move through the results, Enter opens one, Escape closes (the Modal handles Escape, focus trap and focus return)
export default function SearchModal({ initialQuery = '', initialType = '', initialLevel = '', onQueryChange, onClose, onSelect }) {
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState(initialType)
  const [level, setLevel] = useState(initialLevel)
  const [state, setState] = useState({ status: 'idle', results: [] }) // idle | loading | done | error
  const [active, setActive] = useState(-1)
  const input = useRef(null)

  // Search the server, 300 ms after the last keystroke
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setState({ status: 'idle', results: [] })
      return
    }
    setState((s) => ({ ...s, status: 'loading' }))
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const data = await searchAll({ q, type, level }, controller.signal)
        setState({ status: 'done', results: data.results })
        setActive(-1)
      } catch (err) {
        if (err.name !== 'AbortError') setState({ status: 'error', results: [] })
      }
    }, 300)
    return () => {
      clearTimeout(timer) // typed again before 300 ms: forget the pending search
      controller.abort() // typed again while a request is in flight: cancel it
    }
  }, [query, type, level])

  // keep the address bar in step (replace, not push, so Back doesn't walk through every letter)
  useEffect(() => {
    onQueryChange(query.trim())
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const { results, status } = state
  const pick = (r) => onSelect(r, query.trim())

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return
      e.preventDefault()
      setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % results.length : (i <= 0 ? results.length : i) - 1))
    } else if (e.key === 'Enter' && results.length) {
      e.preventDefault()
      pick(results[active >= 0 ? active : 0])
    }
  }

  useEffect(() => {
    if (active >= 0) document.getElementById(`sr-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  let message = ''
  if (status === 'loading') message = 'Searching…'
  else if (status === 'error') message = 'Search is not available right now. Please try again.'
  else if (status === 'done') message = results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'No results'

  return (
    <Modal label="Search news, research papers and books" onClose={onClose} initialFocus={input} align="top" className="md:mt-[6vh] md:max-w-3xl">
      <div className="grid gap-4 p-4 md:p-6">
        <div className="skin-input flex items-center gap-3 p-1 pl-4">
          <label htmlFor="rb-search" className="sr-only">
            Search news, research papers and books
          </label>
          <input
            ref={input}
            id="rb-search"
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="rb-results"
            aria-activedescendant={active >= 0 ? `sr-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck="false"
            maxLength={80}
            placeholder="Search news, papers and books…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="min-h-12 w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted md:text-xl"
          />
          <button type="button" onClick={onClose} className="btn skin-btn shrink-0">
            Esc<span className="sr-only"> — close search</span>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink">Content type</legend>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map(([value, label]) => (
                <button key={label} type="button" aria-pressed={type === value} onClick={() => setType(value)} className="chip">
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink">Difficulty</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={level === ''} onClick={() => setLevel('')} className="chip">
                Any
              </button>
              {LEVELS.map((l) => (
                <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)} className="chip capitalize">
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        {level && (type === '' || type === 'news') && <p className="t-meta">News articles have no difficulty level, so they are hidden while a level is chosen.</p>}

        <p role="status" aria-live="polite" className="t-meta min-h-5 font-bold">
          {message}
        </p>

        <ul id="rb-results" role="listbox" aria-label="Search results" className="grid gap-3">
          {results.map((r, i) => (
            <li
              key={`${r.type}-${r.id}`}
              id={`sr-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(r)}
              className={`skin-card rb-lazy flex cursor-pointer items-start gap-4 p-4 transition-colors ${i === active ? 'bg-sun' : ''}`}
            >
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink-soft text-2xl">
                {TYPE_ICON[r.type] ?? '📄'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 t-meta">
                  <span className="badge bg-ink text-paper">{TYPE_LABEL[r.type]}</span>
                  <LevelBadge level={r.level} />
                  <span>
                    <Highlight text={r.meta} query={query} />
                  </span>
                </span>
                <span className="t-card-title mt-1 block">
                  <Highlight text={r.title} query={query} />
                </span>
                <span className="t-body mt-1 block text-[0.9375rem]">
                  <Highlight text={excerpt(r.snippet, query)} query={query} />
                </span>
              </span>
              <span aria-hidden="true" className="self-center font-bold text-blue">↵</span>
            </li>
          ))}
        </ul>
        <p className="t-meta">↑ ↓ to move · Enter to open · Esc to close</p>
      </div>
    </Modal>
  )
}
