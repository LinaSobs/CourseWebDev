import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'

// Loads the current user's orders. Resets whenever the signed-in user changes,
// so the previous user's data can never flash on screen.
export function useOrders(userId) {
  const [state, setState] = useState({ status: 'idle', list: [], error: null })

  useEffect(() => {
    if (!userId) {
      setState({ status: 'idle', list: [], error: null })
      return
    }
    const ctrl = new AbortController()
    setState({ status: 'loading', list: [], error: null })
    api('/orders', { signal: ctrl.signal })
      .then((list) => setState({ status: 'ready', list, error: null }))
      .catch((error) => {
        if (error?.name === 'AbortError') return
        setState({ status: 'error', list: [], error })
      })
    return () => ctrl.abort()
  }, [userId])

  return state
}

// Derives everything the Overview tab needs from the order list in one pass.
export function useAccountStats(orders, booksById, groups) {
  return useMemo(() => {
    let spent = 0
    let booksBought = 0
    const byGroup = new Map()

    for (const o of orders) {
      spent += o.total
      for (const i of o.items) {
        booksBought += i.quantity
        const g = booksById.get(i.bookId)?.group
        if (g) byGroup.set(g, (byGroup.get(g) ?? 0) + i.quantity)
      }
    }

    let favourite = null
    for (const [gid, count] of byGroup) {
      if (!favourite || count > favourite.count) {
        favourite = { group: groups.find((x) => x.id === gid), count }
      }
    }

    return {
      spent,
      booksBought,
      favourite,
      lastOrder: orders[0] ?? null,
      orderCount: orders.length,
    }
  }, [orders, booksById, groups])
}