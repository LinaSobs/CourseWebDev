import { useCallback, useEffect, useState } from 'react'

// The Research & Book page keeps its state in the address bar, so every view can be bookmarked and shared:
//   #/scientists?section=books&level=beginner      section: news | research | books
//   #/scientists?type=paper                        type:    news | paper | book   (same idea, by content type)
//   #/scientists?q=attention                       q: opens the search with this text
// (The site's router is hash-based, so the "?..." lives after the #/scientists part.)
const SECTIONS = ['news', 'research', 'books']
export const LEVELS = ['beginner', 'intermediate', 'advanced']
const TYPES = ['news', 'paper', 'book']
const TYPE_TO_SECTION = { news: 'news', paper: 'research', book: 'books' }
const BASE = '#/scientists'

// reads the address bar and keeps only values we know (anything else is ignored, never trusted)
function read() {
  const [, query = ''] = window.location.hash.split('?')
  const p = new URLSearchParams(query)
  const pick = (key, allowed) => (allowed.includes(p.get(key)) ? p.get(key) : '')
  const type = pick('type', TYPES)
  return {
    section: pick('section', SECTIONS) || TYPE_TO_SECTION[type] || '',
    level: pick('level', LEVELS),
    type,
    q: (p.get('q') ?? '').slice(0, 80),
  }
}

export const hrefFor = (next) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
  const qs = p.toString()
  return qs ? `${BASE}?${qs}` : BASE
}

export default function useResearchParams() {
  const [params, setParams] = useState(read)

  useEffect(() => {
    const sync = () => setParams(read())
    window.addEventListener('hashchange', sync)
    window.addEventListener('rb-params', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('rb-params', sync)
    }
  }, [])

  // update(changes): merges changes into the current params and writes the address bar.
  //   replace: true  -> no new history entry (used while typing in the search)
  const update = useCallback((changes, { replace = false } = {}) => {
    const next = hrefFor({ ...read(), ...changes })
    if (replace) {
      history.replaceState(null, '', next)
      window.dispatchEvent(new Event('rb-params')) // replaceState does not fire hashchange by itself
    } else {
      window.location.hash = next // adds a history entry, so the Back button works
    }
  }, [])

  return [params, update]
}
