import { useSyncExternalStore } from 'react'

// The selected section of a shelf (Bedtime, Fiction, Study guides...) lives in the address bar:
//   #/teens?cat=fiction        no ?cat= means "Everything"
// Why there and not in useState? Two far-apart components need it: the section drop-down in the Header and the shelf below.
// The address bar is the one place both can read, and it makes every filtered view bookmarkable and shareable.
// (The router in useRoute.js already ignores everything after "?", so pages do not change.)
const EVENT = 'gb-category'

function read() {
  const [, query = ''] = window.location.hash.split('?')
  return new URLSearchParams(query).get('cat') || 'all'
}

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  window.addEventListener(EVENT, callback)
  return () => {
    window.removeEventListener('hashchange', callback)
    window.removeEventListener(EVENT, callback)
  }
}

// change the section without adding a history entry (Back goes to the previous page, not the previous chip)
export function setCategory(id) {
  const [path, query = ''] = window.location.hash.split('?')
  const params = new URLSearchParams(query)
  if (id === 'all') params.delete('cat')
  else params.set('cat', id)
  const qs = params.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${path}${qs ? `?${qs}` : ''}`)
  // replaceState does not fire "hashchange", so tell the listeners ourselves
  window.dispatchEvent(new Event(EVENT))
}

// after a pick we glide down to the books. The header's auto-hide must not read that glide as "the user scrolled away".
let lockedUntil = 0
export const isScrollLocked = () => Date.now() < lockedUntil

export function pickCategory(id) {
  setCategory(id)
  lockedUntil = Date.now() + 900
  document.getElementById('shelf')?.scrollIntoView({ behavior: 'smooth' })
}

export default function useCategory() {
  return useSyncExternalStore(subscribe, read, () => 'all')
}
