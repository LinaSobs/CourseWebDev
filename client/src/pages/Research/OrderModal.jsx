import { useEffect, useRef, useState } from 'react'
import Modal, { DialogBar } from './Modal'
import { Highlight, LevelBadge, money, stockInfo } from './bits'
import { asset } from '../../lib/asset'
import { fetchBooks, placeOrder } from '../../lib/researchApi'

const MAX_QTY = 10
const field = 'skin-input min-h-12 w-full px-4 text-base'
const label = 'mb-1 block text-sm font-bold text-ink'

// The order window. Left: find books (title, author, ISBN or subject). Right: your order + delivery details.
// The cart only remembers book ids and quantities. The server looks up prices and stock itself when you submit,
// so the total shown here is a convenience, never what you are charged.
export default function OrderModal({ cart, setCart, initialSearch = '', onClose }) {
  const [q, setQ] = useState(initialSearch)
  const [found, setFound] = useState({ status: 'loading', books: [] })
  const [form, setForm] = useState({ name: '', email: '', address: '' })
  const [state, setState] = useState({ status: 'idle', error: '' }) // idle | sending | error
  const [receipt, setReceipt] = useState(null)
  const searchInput = useRef(null)
  const errorBox = useRef(null)

  // debounce + cancel older requests, same idea as the main search
  useEffect(() => {
    const controller = new AbortController()
    setFound((f) => ({ ...f, status: 'loading' }))
    const timer = setTimeout(async () => {
      try {
        setFound({ status: 'done', books: await fetchBooks({ q: q.trim() }, controller.signal) })
      } catch (err) {
        if (err.name !== 'AbortError') setFound({ status: 'error', books: [] })
      }
    }, q ? 300 : 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q])

  // cart: { [bookId]: { book, quantity } }
  const add = (book) =>
    setCart((c) => {
      const have = c[book.id]?.quantity ?? 0
      return { ...c, [book.id]: { book, quantity: Math.min(have + 1, MAX_QTY, book.stock_quantity) } }
    })
  const setQty = (id, quantity) =>
    setCart((c) => {
      const next = { ...c }
      if (quantity < 1) delete next[id]
      else next[id] = { ...c[id], quantity: Math.min(quantity, MAX_QTY, c[id].book.stock_quantity) }
      return next
    })

  const lines = Object.values(cart)
  const total = lines.reduce((sum, l) => sum + l.book.price * l.quantity, 0)

  const submit = async (e) => {
    e.preventDefault()
    if (!lines.length) return
    setState({ status: 'sending', error: '' })
    try {
      const order = await placeOrder({ ...form, items: lines.map((l) => ({ bookId: l.book.id, quantity: l.quantity })) })
      setReceipt(order)
      setCart({})
      setState({ status: 'idle', error: '' })
    } catch (err) {
      setState({ status: 'error', error: err.message })
      fetchBooks({ q: q.trim() }).then((books) => setFound({ status: 'done', books })).catch(() => {}) // stock may have changed: refresh the list
      setTimeout(() => errorBox.current?.focus(), 0)
    }
  }

  // ------------------------------------------------------------ after the order
  if (receipt) {
    return (
      <Modal label="Order placed" onClose={onClose} className="md:max-w-xl">
        <DialogBar title="Order placed" onClose={onClose} />
        <div className="grid gap-4 p-5 md:p-8">
          <h3 className="t-title md:text-4xl">Thank you! Order #{receipt.id} is in.</h3>
          <ul className="overflow-hidden rounded-2xl border border-line bg-skin-surface">
            {receipt.items.map((i) => (
              <li key={i.title} className="t-body flex justify-between gap-3 border-b border-line p-3 last:border-b-0">
                <span>
                  {i.quantity} × {i.title}
                </span>
                <span className="font-bold text-ink">{money(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 bg-sun p-3 font-display text-xl font-extrabold">
              <span>Total</span>
              <span>{money(receipt.total)}</span>
            </li>
          </ul>
          <p className="t-body">Your order is saved. Keep your order number for any questions.</p>
          <button type="button" onClick={onClose} className="btn skin-btn skin-btn-pop w-fit">
            Back to the page
          </button>
        </div>
      </Modal>
    )
  }

  // ------------------------------------------------------------ the order window
  return (
    <Modal label="Order books" onClose={onClose} initialFocus={searchInput} className="md:max-w-6xl">
      <DialogBar title="Order books" onClose={onClose} />
      <div className="grid gap-6 p-4 md:grid-cols-[1.15fr_1fr] md:p-6">
        {/* ---------- find books */}
        <section aria-labelledby="ow-find" className="grid content-start gap-4">
          <h3 id="ow-find" className="t-title">
            1. Pick your books
          </h3>
          <div>
            <label htmlFor="ow-search" className={label}>
              Search by title, author, ISBN or subject
            </label>
            <input ref={searchInput} id="ow-search" type="search" autoComplete="off" maxLength={80} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. statistics, Lindqvist, 9798891000018" className={field} />
          </div>
          <p role="status" aria-live="polite" className="t-meta font-bold">
            {found.status === 'loading' ? 'Loading…' : found.status === 'error' ? 'Could not load books.' : `${found.books.length} book${found.books.length === 1 ? '' : 's'}`}
          </p>
          <ul className="grid max-h-[26rem] gap-3 overflow-y-auto pr-1 md:max-h-[34rem]">
            {found.books.map((b) => {
              const stock = stockInfo(b.stock_quantity)
              const inCart = cart[b.id]?.quantity ?? 0
              const out = b.stock_quantity <= 0 || inCart >= Math.min(MAX_QTY, b.stock_quantity)
              return (
                <li key={b.id} className="skin-card rb-lazy grid grid-cols-[72px_1fr] gap-3 p-3 sm:grid-cols-[72px_1fr_auto]">
                  <img src={asset(b.cover_image_url)} alt={`Cover of ${b.title}`} width="72" height="96" loading="lazy" decoding="async" className="aspect-[3/4] w-[72px] rounded-lg object-cover" />
                  <div className="grid content-start gap-1">
                    <p className="t-card-title text-lg md:text-lg">
                      <Highlight text={b.title} query={q} />
                    </p>
                    <p className="t-meta">
                      <Highlight text={b.author} query={q} /> · ISBN {b.isbn}
                    </p>
                    <p className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={b.difficulty_level} />
                      <span className="font-display text-lg font-extrabold text-blue">{money(b.price)}</span>
                      <span className={`badge ${stock.cls}`}>{stock.label}</span>
                    </p>
                  </div>
                  <button type="button" disabled={out} onClick={() => add(b)} className="btn skin-btn col-span-2 sm:col-span-1 sm:self-center">
                    {b.stock_quantity <= 0 ? 'Sold out' : inCart ? `Added (${inCart})` : 'Add'}
                    <span className="sr-only"> {b.title} to your order</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------- order + details */}
        <form onSubmit={submit} className="skin-card grid content-start gap-4 p-5" aria-labelledby="ow-order">
          <h3 id="ow-order" className="t-title">
            2. Your order
          </h3>

          {lines.length === 0 ? (
            <p className="t-body rounded-2xl border-2 border-dashed border-line p-4">Your order is empty. Add a book from the list.</p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-line">
              {lines.map(({ book, quantity }) => (
                <li key={book.id} className="grid gap-2 border-b border-line p-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-ink">{book.title}</p>
                    <p className="t-meta font-bold text-ink">{money(book.price * quantity)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setQty(book.id, quantity - 1)} className="chip min-w-11 justify-center px-0 text-lg" aria-label={`One fewer ${book.title}`}>
                      −
                    </button>
                    <output aria-label={`Quantity of ${book.title}`} className="min-w-8 text-center text-lg font-bold">
                      {quantity}
                    </output>
                    <button type="button" onClick={() => setQty(book.id, quantity + 1)} disabled={quantity >= Math.min(MAX_QTY, book.stock_quantity)} className="chip min-w-11 justify-center px-0 text-lg disabled:cursor-not-allowed disabled:opacity-40" aria-label={`One more ${book.title}`}>
                      +
                    </button>
                    <button type="button" onClick={() => setQty(book.id, 0)} className="ml-auto min-h-11 rounded-full px-3 text-sm font-bold text-blue underline underline-offset-4 hover:bg-sun">
                      Remove<span className="sr-only"> {book.title}</span>
                    </button>
                  </div>
                </li>
              ))}
              <li className="flex justify-between bg-sun p-3 font-display text-xl font-extrabold">
                <span>Total</span>
                <span>{money(total)}</span>
              </li>
            </ul>
          )}
          <p className="t-meta">Prices and stock are confirmed by our server when you order.</p>

          <div>
            <label htmlFor="ow-name" className={label}>
              Full name
            </label>
            <input id="ow-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="ow-email" className={label}>
              Email
            </label>
            <input id="ow-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="ow-address" className={label}>
              Delivery address
            </label>
            <textarea id="ow-address" name="address" autoComplete="street-address" required minLength={6} maxLength={300} rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${field} rounded-2xl py-2`} />
          </div>

          {state.status === 'error' && (
            <p ref={errorBox} tabIndex={-1} role="alert" className="rounded-2xl bg-coral p-3 font-bold text-ink">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={!lines.length || state.status === 'sending'} className="btn btn-lg skin-btn w-full">
            {state.status === 'sending' ? 'Placing order…' : `Place order · ${money(total)}`}
          </button>
        </form>
      </div>
    </Modal>
  )
}
