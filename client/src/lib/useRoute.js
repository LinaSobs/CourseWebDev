import { useEffect, useState } from 'react'

// A tiny router, no library. The page is whatever comes after "#/" in the address bar:
//   "#/kids" -> "kids"     "#/" or nothing -> "" (home)
//   "#/scientists?level=beginner" -> "scientists" (the part after ? belongs to the page, see useResearchParams)
// Other hashes (#contact, #shelf...) are normal in-page jumps, so they keep the current page.
const read = (current) => {
  const hash = window.location.hash
  if (hash.startsWith('#/')) return hash.slice(2).split('?')[0]
  if (hash === '' || hash === '#') return ''
  return current
}

export default function useRoute() {
  const [route, setRoute] = useState(() => read(''))

  useEffect(() => {
    const onChange = () => setRoute((current) => read(current))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
