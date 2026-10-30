import { useCallback, useMemo, useState } from 'react'
import { useShop } from '../../context/ShopContext'
import { useSkin } from '../../context/SkinContext'
import { useCatalog } from '../../context/CatalogContext'
import { authClient } from '../../lib/authClient'
import { cover } from '../../lib/asset'
import { formatPrice } from '../../lib/format'
import { voices } from '../../data/themes'
import Container from '../../shared/Container'
import LoadMore, { useLoadMore } from '../../shared/LoadMore'
import Button from '../../shared/Button'
import ProfileBackdrop from './ProfileBackdrop'
import SlidingTabs from '../../layout/Header/SlidingTabs'
import { Stat, Empty, Avatar, OrderCard } from './primitives'
import { useOrders, useAccountStats } from './useAccountData'
import ProfilePanel from './ProfilePanel'

export default function AccountPage() {
  const { user, sessionLoading, openAuth, wishlist, toggleWishlist, addToCart, setCartOpen, notify } = useShop()
  const { groups, books } = useCatalog()
  const voice = voices[useSkin()] ?? voices.home
  const [tab, setTab] = useState('overview')

  const orders = useOrders(user?.id)
  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books])
  const stats = useAccountStats(orders.list, booksById, groups)

  const inStock = useMemo(() => wishlist.filter((b) => b.stock !== 0), [wishlist])
  const wishlistTotal = useMemo(
    () => inStock.reduce((s, b) => s + b.price, 0),
    [inStock],
  )

  // wishlist and orders show 5 at a time
  const wishPage = useLoadMore(wishlist, 'wishlist')
  const orderPage = useLoadMore(orders.list ?? [], 'orders')

  const [addingAll, setAddingAll] = useState(false)
  const addAllToCart = useCallback(
    async (list) => {
      if (addingAll || list.length === 0) return
      setAddingAll(true)
      try {
        for (const book of list) await addToCart(book)
        setCartOpen(true)
      } catch {
        notify('Some books could not be added — stock may have changed.')
      } finally {
        setAddingAll(false)
      }
    },
    [addingAll, addToCart, setCartOpen, notify],
  )

  const buyAgain = useCallback(
    (items) => {
      const list = items.map((i) => booksById.get(i.bookId)).filter(Boolean)
      if (list.length < items.length) notify('Some books are no longer available.')
      addAllToCart(list)
    },
    [booksById, addAllToCart, notify],
  )

  const [signingOut, setSigningOut] = useState(false)
  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    const { error } = await authClient.signOut()
    if (error) {
      setSigningOut(false)
      notify('We could not sign you out. Please try again.')
      return
    }
    notify('You are signed out.')
    window.location.hash = '#/'
  }

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'wishlist', label: 'Wishlist', count: wishlist.length || undefined },
      {
        id: 'orders',
        label: 'Orders',
        count:
          orders.status === 'ready' && orders.list.length
            ? orders.list.length
            : undefined,
      },
      { id: 'profile', label: 'Profile' },
    ],
    [wishlist.length, orders.status, orders.list.length],
  )

  if (sessionLoading) return <section className="min-h-[60vh] bg-skin-bg" />

  if (!user) {
    return (
      <section className="grid min-h-[60vh] place-items-center bg-skin-bg py-20 text-center text-skin-ink">
        <Container className="grid justify-items-center gap-4">
          <p className="animate-hop text-6xl motion-reduce:animate-none" aria-hidden="true">
            {voice.icon}
          </p>
          <h1 className="t-display">Your account</h1>
          <p className="text-xl">Please sign in to see your wishlist and orders.</p>
          <Button as="button" type="button" variant="skin" large onClick={() => openAuth('signin')}>
            Sign in
          </Button>
        </Container>
      </section>
    )
  }

  const ready = orders.status === 'ready'

  return (
    <section className="animate-page relative isolate overflow-hidden bg-skin-bg pt-10 pb-24 text-skin-ink motion-reduce:animate-none md:pt-16 md:pb-40">
      <ProfileBackdrop />
      <Container className="grid gap-8">
        <header className="flex flex-wrap items-center gap-5">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="t-display">{voice.greeting(user.name)}</h1>
            <p className="mt-2 text-lg break-words text-skin-muted">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="btn skin-btn skin-btn-soft min-h-11"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </header>

        <div className="border-b-2 border-skin-line pb-2">
          <SlidingTabs
            mode="tabs"
            label="Account sections"
            items={tabs}
            activeId={tab}
            onSelect={(t) => setTab(t.id)}
          />
        </div>

        {tab === 'overview' && (
          <div
            role="tabpanel"
            id="panel-overview"
            aria-labelledby="tab-overview"
            tabIndex={-1}
            className="grid gap-8"
          >
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon="💙" value={wishlist.length} label="Saved books" />
              <Stat
                icon="📦"
                value={ready ? stats.orderCount : '–'}
                label={stats.orderCount === 1 ? 'Order' : 'Orders'}
              />
              <Stat icon="📚" value={ready ? stats.booksBought : '–'} label="Books bought" />
              <Stat icon="💳" value={ready ? formatPrice(stats.spent) : '–'} label="Spent so far" />
            </dl>

            {stats.favourite?.group && (
              <a
                href={`#/${stats.favourite.group.id}`}
                className="skin-card skin-card--flat flex flex-wrap items-center gap-3 px-5 py-4 text-lg transition hover:-translate-y-0.5"
              >
                <span aria-hidden="true" className="text-3xl">
                  {(voices[stats.favourite.group.id] ?? voices.home).icon}
                </span>
                <span>
                  Your favourite shelf is <strong>{stats.favourite.group.title}</strong>
                  <span className="text-skin-muted">
                    {' '}
                    · {stats.favourite.count}{' '}
                    {stats.favourite.count === 1 ? 'book' : 'books'} bought
                  </span>
                </span>
                <span className="ml-auto font-bold text-skin-link underline">
                  Browse it →
                </span>
              </a>
            )}

            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-skin text-2xl font-extrabold">Latest order</h2>
                {ready && stats.orderCount > 1 && (
                  <button
                    type="button"
                    onClick={() => setTab('orders')}
                    className="min-h-11 font-bold text-skin-link underline"
                  >
                    See all {stats.orderCount} orders
                  </button>
                )}
              </div>
              {orders.status === 'loading' && <p role="status">Loading your orders…</p>}
              {orders.status === 'error' && (
                <p role="alert">We couldn’t load your orders. Please refresh.</p>
              )}
              {ready && stats.orderCount === 0 && (
                <Empty icon={voice.icon}>{voice.ordersEmpty}</Empty>
              )}
              {stats.lastOrder && (
                <ul>
                  <OrderCard
                    o={stats.lastOrder}
                    onBuyAgain={buyAgain}
                    busy={addingAll}
                  />
                </ul>
              )}
            </div>

            {wishlist.length > 0 && (
              <div>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-skin text-2xl font-extrabold">On your wishlist</h2>
                  <button
                    type="button"
                    onClick={() => setTab('wishlist')}
                    className="min-h-11 font-bold text-skin-link underline"
                  >
                    See all {wishlist.length}
                  </button>
                </div>
                <ul className="flex flex-wrap gap-3">
                  {wishlist.slice(0, 6).map((book) => (
                    <li key={book.id}>
                      <img
                        src={cover(book.id)}
                        alt={book.title}
                        width="72"
                        height="97"
                        loading="lazy"
                        className="h-[97px] w-[72px] rounded-md border-2 border-skin-edge"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="mb-3 font-skin text-2xl font-extrabold">Keep shopping</h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#/"
                  className="skin-btn inline-flex min-h-12 items-center px-6 text-lg font-bold"
                >
                  All shelves
                </a>
                {groups.map((g) => (
                  <a
                    key={g.id}
                    href={`#/${g.id}`}
                    className="btn skin-btn skin-btn-soft"
                  >
                    <span aria-hidden="true" className="mr-1.5">
                      {(voices[g.id] ?? voices.home).icon}
                    </span>
                    {g.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'wishlist' && (
          <div
            role="tabpanel"
            id="panel-wishlist"
            aria-labelledby="tab-wishlist"
            tabIndex={-1}
            className="grid gap-5"
          >
            {wishlist.length === 0 ? (
              <Empty icon={voice.icon}>{voice.wishlistEmpty}</Empty>
            ) : (
              <>
                <div className="skin-card skin-card--flat flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <p className="text-lg">
                    <strong>{wishlist.length}</strong> saved{' '}
                    {wishlist.length === 1 ? 'book' : 'books'}
                    {inStock.length > 0 && (
                      <span className="text-skin-muted">
                        {' '}
                        · {formatPrice(wishlistTotal)} for the{' '}
                        {inStock.length === wishlist.length
                          ? 'lot'
                          : `${inStock.length} in stock`}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    disabled={inStock.length === 0 || addingAll}
                    onClick={() => addAllToCart(inStock)}
                    className="btn skin-btn skin-btn-pop"
                  >
                    {addingAll
                      ? 'Adding…'
                      : `Add ${inStock.length === wishlist.length ? 'all' : 'available'} to cart`}
                  </button>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {wishPage.shown.map((book) => (
                    <li
                      key={book.id}
                      className="skin-card skin-card--flat flex gap-4 p-4"
                    >
                      <img
                        src={cover(book.id)}
                        alt=""
                        width="72"
                        height="97"
                        className="h-[97px] w-[72px] rounded-md border-2 border-skin-edge"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="font-skin text-lg leading-tight font-extrabold">
                          {book.title}
                        </p>
                        <p className="text-sm text-skin-muted">
                          {book.author} · {formatPrice(book.price)}
                        </p>
                        <div className="mt-auto flex flex-wrap gap-3 text-sm font-bold">
                          <button
                            type="button"
                            disabled={book.stock === 0}
                            onClick={() => addToCart(book)}
                            className="min-h-11 text-skin-link underline disabled:opacity-40"
                          >
                            {book.stock === 0 ? 'Sold out' : 'Add to cart'}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(book)}
                            className="min-h-11 text-skin-muted underline hover:text-skin-danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <LoadMore hasMore={wishPage.hasMore} onMore={wishPage.more} shown={wishPage.shown.length} total={wishPage.total} />
              </>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div
            role="tabpanel"
            id="panel-orders"
            aria-labelledby="tab-orders"
            tabIndex={-1}
          >
            {orders.status === 'loading' && <p role="status">Loading your orders…</p>}
            {orders.status === 'error' && (
              <p role="alert">We couldn’t load your orders. Please refresh.</p>
            )}
            {ready && stats.orderCount === 0 && (
              <Empty icon={voice.icon}>{voice.ordersEmpty}</Empty>
            )}
            {ready && stats.orderCount > 0 && (
              <>
              <ul className="grid gap-4">
                {orderPage.shown.map((o) => (
                  <OrderCard
                    key={o.id}
                    o={o}
                    onBuyAgain={buyAgain}
                    busy={addingAll}
                  />
                ))}
              </ul>
              <LoadMore hasMore={orderPage.hasMore} onMore={orderPage.more} shown={orderPage.shown.length} total={orderPage.total} />
              </>
            )}
          </div>
        )}

        {tab === 'profile' && <ProfilePanel user={user} />}
      </Container>
    </section>
  )
}