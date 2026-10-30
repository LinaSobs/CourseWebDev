import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

// The catalog (reader groups + all books) is needed all over the site: menu, home tiles, marquee, footer, contact form...
// So it is fetched ONCE here, and any component can read it with useCatalog().
// status: 'loading' -> 'ready' (or 'error')
const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', groups: [], books: [] })

  const load = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }))
    Promise.all([api('/groups'), api('/books')])
      .then(([groups, books]) => setState({ status: 'ready', groups, books }))
      .catch(() => setState((s) => ({ ...s, status: 'error' })))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return <CatalogContext.Provider value={{ ...state, reload: load }}>{children}</CatalogContext.Provider>
}

export const useCatalog = () => useContext(CatalogContext)
