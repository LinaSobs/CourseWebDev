import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { authClient } from '../lib/authClient'

// Everything about "me as a shopper": who is signed in, my cart, my wishlist, and the pop-ups (sign-in dialog, cart drawer, toast).
// Components call small actions like addToCart(book) and never worry about fetch or sign-in checks.
const ShopContext = createContext(null)
// The toast text lives in its OWN context. It changes twice per message, and when it lived in ShopContext
// every book card, the header and the drawer re-rendered each time.
const NoticeContext = createContext({ notice: '', noticeTone: 'ok' })
const emptyCart = { items: [], total: 0 }

export function ShopProvider({ children }) {
  // Better Auth's hook: `data` is the session (or null) and it updates by itself after sign-in / sign-out.
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const user = session?.user ?? null

  const [cart, setCart] = useState(emptyCart)
  const [wishlist, setWishlist] = useState([])
  const [purchased, setPurchased] = useState(() => new Set()) // ids of every book this person has ordered before
  const [authMode, setAuthMode] = useState(null) // null (closed) | 'signin' | 'signup'
  const [cartOpen, setCartOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0) // bump it to re-read the cart and owned books (after a payment)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('ok') // 'ok' gets a tick, 'error' gets a !

  // a short message at the bottom of the screen
  const notify = useCallback((message, tone = 'ok') => {
    setNotice(message)
    setNoticeTone(tone)
    window.setTimeout(() => setNotice((current) => (current === message ? '' : current)), 3500)
  }, [])

  // Whenever the signed-in person changes: load their cart + wishlist from the server (or clear them on sign-out).
  useEffect(() => {
    if (!user) {
      setCart(emptyCart)
      setWishlist([])
      setPurchased(new Set())
      return
    }
    let ignore = false // if the user changes before the answer arrives, drop the old answer
    Promise.all([
      api('/cart'),
      api('/wishlist'),
      // past orders -> the ids of the books in them (if this one fails the shelves just show no "owned" books)
      api('/orders')
        .then((orders) => orders.filter((o) => o.status === 'paid' || o.status === 'demo').flatMap((o) => o.items.map((i) => i.bookId)))
        .catch(() => []),
    ])
      .then(([c, w, ownedIds]) => {
        if (ignore) return
        setCart(c)
        setWishlist(w.items)
        setPurchased(new Set(ownedIds))
      })
      .catch(() => notify('Could not load your cart. Please refresh.', 'error'))
    return () => {
      ignore = true
    }
  }, [user?.id, reloadTick, notify]) // eslint-disable-line react-hooks/exhaustive-deps

  // run a server action; show its error as a toast instead of crashing
  const attempt = useCallback(
    async (work) => {
      try {
        return await work()
      } catch (err) {
        notify(err.message, 'error')
      }
    },
    [notify],
  )

  // Anything that needs an account first checks this. Signed out? Open the sign-in dialog and stop.
  const needLogin = () => {
    if (user) return false
    setAuthMode('signin')
    return true
  }

  const value = useMemo(
    () => ({
      user,
      sessionLoading,
      authMode,
      openAuth: setAuthMode,
      closeAuth: () => setAuthMode(null),
      cartOpen,
      setCartOpen,
      notify,

      cart,
      cartCount: cart.items.reduce((n, i) => n + i.quantity, 0),
      // true = it worked, false = sign in first, undefined = the server said no (the toast tells why)
      addToCart: (book, quantity = 1) =>
        needLogin()
          ? false
          : attempt(async () => {
              setCart(await api('/cart', { method: 'POST', body: { bookId: book.id, quantity } }))
              notify(`Added “${book.title}” to your cart.`)
              return true
            }),
      setQuantity: (bookId, quantity) =>
        attempt(async () => setCart(await api(`/cart/${bookId}`, { method: 'PUT', body: { quantity } }))),
      removeFromCart: (bookId) => attempt(async () => setCart(await api(`/cart/${bookId}`, { method: 'DELETE' }))),
      refreshShop: () => setReloadTick((n) => n + 1),
      // Starts a payment: the server saves a pending order and returns the address of Stripe's hosted payment page,
      // and we send the browser there. It throws on purpose: the cart drawer shows the error inside the form.
      checkout: async (form) => {
        const { url } = await api('/checkout', { method: 'POST', body: form })
        window.location.assign(url)
      },

      isPurchased: (bookId) => purchased.has(bookId),
      wishlist,
      isSaved: (bookId) => wishlist.some((b) => b.id === bookId),
      toggleWishlist: (book) =>
        needLogin() ||
        attempt(async () => {
          const saved = wishlist.some((b) => b.id === book.id)
          const result = await api(`/wishlist/${book.id}`, { method: saved ? 'DELETE' : 'PUT' })
          setWishlist(result.items)
        }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, sessionLoading, authMode, cartOpen, cart, wishlist, purchased],
  )
  const noticeValue = useMemo(() => ({ notice, noticeTone }), [notice, noticeTone])

  return (
    <ShopContext.Provider value={value}>
      <NoticeContext.Provider value={noticeValue}>{children}</NoticeContext.Provider>
    </ShopContext.Provider>
  )
}

export const useNotice = () => useContext(NoticeContext)

export const useShop = () => useContext(ShopContext)
