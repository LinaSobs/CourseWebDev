import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import { useShop } from '../../context/ShopContext'
import Button from '../../shared/Button'
import MathPlane from '../../shared/MathPlane/MathPlane'
import PurchasedBook from '../../shared/PurchasedBook/PurchasedBook'

// The page Stripe sends people back to:  #/checkout/success?order=12   or   #/checkout/cancelled?order=12
//
// IMPORTANT: arriving here does NOT mean the payment worked (anyone can type this address).
// The only truth is the order's status in OUR database, and only Stripe's webhook can set it to 'paid'.
// The webhook usually arrives a moment after the redirect, so we ask the server again every 1.5 seconds (up to 10 times).
const orderIdFromAddress = () => Number(new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('order')) || null

const MAX_TRIES = 10
const WAIT_MS = 1500

function useOrderStatus(orderId, enabled, round) {
  const [state, setState] = useState({ order: null, error: '', gaveUp: false })
  useEffect(() => {
    if (!orderId || !enabled) return
    let stopped = false
    let timer
    let tries = 0
    const check = async () => {
      try {
        const order = await api(`/orders/${orderId}`)
        if (stopped) return
        tries += 1
        const waiting = order.status === 'pending'
        setState({ order, error: '', gaveUp: waiting && tries >= MAX_TRIES })
        if (waiting && tries < MAX_TRIES) timer = window.setTimeout(check, WAIT_MS)
      } catch (err) {
        if (!stopped) setState({ order: null, error: err.message, gaveUp: false })
      }
    }
    setState({ order: null, error: '', gaveUp: false })
    check()
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [orderId, enabled, round])
  return state
}

export default function CheckoutResult({ cancelled = false }) {
  const { user, sessionLoading, openAuth, setCartOpen, refreshShop } = useShop()
  const orderId = orderIdFromAddress()
  const [round, setRound] = useState(0)
  const { order, error, gaveUp } = useOrderStatus(orderId, !cancelled && !!user, round)

  // once the webhook has run, the server emptied the cart and the books are owned: reload both
  useEffect(() => {
    if (order?.status === 'paid') refreshShop()
  }, [order?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  let body
  if (cancelled) {
    body = (
      <>
        <h1 className="font-skin text-4xl font-extrabold">Payment cancelled</h1>
        <p>Nothing was charged. Your books are still in your cart whenever you want to try again.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button as="button" type="button" variant="skin" large onClick={() => setCartOpen(true)}>Back to my cart</Button>
          <Button href="#/" variant="skin">Keep shopping</Button>
        </div>
      </>
    )
  } else if (sessionLoading) {
    body = <p role="status">Checking your account…</p>
  } else if (!user) {
    body = (
      <>
        <h1 className="font-skin text-4xl font-extrabold">Sign in to see your order</h1>
        <Button as="button" type="button" variant="skin" large onClick={() => openAuth('signin')}>Sign in</Button>
      </>
    )
  } else if (!orderId || error) {
    body = (
      <>
        <h1 className="font-skin text-4xl font-extrabold">We could not find that order</h1>
        <p role="alert">{error || 'The address is missing an order number.'}</p>
        <Button href="#/account" variant="skin">My account</Button>
      </>
    )
  } else if (!order) {
    body = <p role="status">Loading your order…</p>
  } else if (order.status === 'paid' || order.status === 'demo') {
    body = (
      <>
        <p className="rounded-full bg-skin-pop px-4 py-1 text-sm font-extrabold tracking-wide text-skin-pop-ink uppercase">Paid</p>
        <h1 className="font-skin text-4xl font-extrabold">Payment received. Thank you!</h1>
        <div className="flex max-h-[min(48dvh,440px)] flex-wrap justify-center gap-x-4 gap-y-8 overflow-y-auto px-2 pt-20 pb-4">
          {order.items.map((i, idx) => (
            <PurchasedBook key={i.bookId} book={{ id: i.bookId, title: i.title }} delay={idx * 0.18} />
          ))}
        </div>
        <p>
          Order <strong>#{order.id}</strong> for <strong>{formatPrice(order.total)}</strong> is paid and on its way to {order.shipTo.name} in {order.shipTo.country}.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button href="#/account" variant="skin" large>View my orders</Button>
          <Button href="#/" variant="skin">Keep shopping</Button>
        </div>
      </>
    )
  } else if (order.status === 'expired') {
    body = (
      <>
        <h1 className="font-skin text-4xl font-extrabold">This payment was not completed</h1>
        <p>Order #{order.id} was not paid, so nothing was charged. Your cart is unchanged if you want to try again.</p>
        <Button as="button" type="button" variant="skin" large onClick={() => setCartOpen(true)}>Back to my cart</Button>
      </>
    )
  } else {
    // still 'pending': waiting for Stripe's webhook
    body = (
      <>
        <h1 className="font-skin text-4xl font-extrabold">{gaveUp ? 'Still confirming your payment' : 'Confirming your payment…'}</h1>
        <p role="status">
          {gaveUp
            ? `Stripe has not confirmed order #${order.id} yet. If you paid, it will show as Paid under My account in a minute.`
            : `Waiting for Stripe to confirm order #${order.id}. This usually takes a few seconds.`}
        </p>
        {gaveUp && (
          <div className="flex flex-wrap justify-center gap-3">
            <Button as="button" type="button" variant="skin" onClick={() => setRound((n) => n + 1)}>Check again</Button>
            <Button href="#/account" variant="skin">My account</Button>
          </div>
        )}
      </>
    )
  }

  return (
    <section aria-live="polite" className="mx-auto max-w-3xl px-5 py-16">
      <MathPlane className="grid content-center justify-items-center gap-4 rounded-3xl bg-skin-surface p-8 text-center">{body}</MathPlane>
    </section>
  )
}
