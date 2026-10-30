import { useCallback, useMemo, useSyncExternalStore } from 'react'

// The reading list: which papers the visitor starred. Kept in localStorage on this device (no account needed),
// and shared between every component on the page, so a star in the PDF viewer shows on the card at once.
const KEY = 'gb-saved-papers'

function load() {
  try {
    return localStorage.getItem(KEY) || '[]'
  } catch {
    return '[]' // storage can be blocked (private mode): the list then lives until the page is closed
  }
}

let raw = typeof window === 'undefined' ? '[]' : load()
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  // another tab changed the list
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    raw = e.newValue || '[]'
    emit()
  })
}

const subscribe = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export default function useSavedPapers() {
  const snap = useSyncExternalStore(subscribe, () => raw, () => '[]')
  const ids = useMemo(() => {
    try {
      const list = JSON.parse(snap)
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }, [snap])
  const saved = useMemo(() => new Set(ids), [ids])

  const toggle = useCallback(
    (id) => {
      const next = new Set(ids)
      if (!next.delete(id)) next.add(id)
      raw = JSON.stringify([...next])
      try {
        localStorage.setItem(KEY, raw)
      } catch {
        // see above: the list still works for this visit
      }
      emit()
    },
    [ids],
  )

  return { saved, toggle }
}
