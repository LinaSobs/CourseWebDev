import { useEffect, useRef, useState } from 'react'
import { useShop } from '../../context/ShopContext'
import { formatPrice } from '../../lib/format'
import { cover } from '../../lib/asset'
import { voices } from '../../data/themes'
import { useSkin } from '../../context/SkinContext'
import Stepper from '../../shared/Stepper'
import Button from '../../shared/Button'

const inputCls = 'skin-input min-h-12 w-full px-3 py-2.5 text-base'

// The cart, as a panel that slides in from the right. Two views: the list ('cart') and the address form ('checkout'). Paying happens on Stripe's page, and the thank-you is the #/checkout/success page.
export default function CartDrawer() {
  const { user, cart, cartOpen, setCartOpen, setQuantity, removeFromCart, checkout, openAuth } = useShop()
  const ref = useRef(null)
  const [view, setView] = useState('cart')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // the dialog sits inside the app's skin wrapper, so it already has the right colours; the words come from the shelf's voice
  const voice = voices[useSkin()] ?? voices.home

  useEffect(() => {
    const dialog = ref.current
    if (cartOpen && !dialog.open) dialog.showModal()
    if (!cartOpen && dialog.open) dialog.close()
    if (cartOpen) setError('')
    if (!cartOpen && view === 'checkout') setView('cart')
  }, [cartOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  async function placeOrder(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await checkout(Object.fromEntries(new FormData(e.currentTarget))) // on success the browser leaves for Stripe
    } catch (err) {
      setError(err.message) // e.g. "Sorry, ... doesn't have enough copies left."
      setBusy(false)
    }
  }

  const close = () => setCartOpen(false)

  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(e) => e.target === ref.current && close()}
      aria-label="Shopping cart"
      className="drawer mr-0 ml-auto h-dvh max-h-none w-[min(440px,100vw)] max-w-none rounded-none bg-skin-surface p-0 text-skin-ink backdrop:bg-ink/60"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b-2 border-skin-line p-5">
          <h2 className="font-skin text-3xl font-extrabold tracking-[-0.03em]">
            {view === 'checkout' ? 'Delivery details' : 'Your cart'}
            {view === 'cart' && cart.items.length > 0 && <span className="ml-2 align-middle text-base font-bold text-skin-muted">({cart.items.reduce((n, i) => n + i.quantity, 0)})</span>}
          </h2>
          <button type="button" onClick={close} aria-label="Close cart" className="grid size-11 place-items-center text-2xl">
            &times;
          </button>
        </header>

        {!user ? (
          <div className="grid flex-1 content-center justify-items-center gap-4 p-8 text-center">
            <p className="text-6xl" aria-hidden="true">{voice.icon}</p>
            <p className="text-xl">Sign in to use your cart.</p>
            <Button as="button" type="button" variant="skin" onClick={() => { setCartOpen(false); openAuth('signin') }}>Sign in</Button>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="grid flex-1 content-center justify-items-center gap-4 p-8 text-center">
            <p className="animate-hop text-6xl motion-reduce:animate-none" aria-hidden="true">{voice.icon}</p>
            <p className="font-skin text-2xl font-extrabold">{voice.cartEmpty}</p>
            <Button as="button" type="button" variant="skin" onClick={close}>{voice.cartCta}</Button>
          </div>
        ) : view === 'checkout' ? (
          <form onSubmit={placeOrder} className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
            <label className="grid gap-1 font-medium">Full name
              <input name="name" required defaultValue={user.name} autoComplete="name" className={inputCls} />
            </label>
            <label className="grid gap-1 font-medium">Address
              <textarea name="address" required rows={3} autoComplete="street-address" className={`${inputCls} resize-y`} />
            </label>
            <label className="grid gap-1 font-medium">Country
              <input name="country" required autoComplete="country-name" className={inputCls} />
            </label>
            <p className="text-sm text-skin-muted">
              Next you pay on Stripe's secure page. This is <strong>test mode</strong>: use card <strong>4242 4242 4242 4242</strong>, any future date and any 3 digits. No real money moves.
            </p>
            <p role="alert" className="min-h-6 font-medium text-skin-danger">{error}</p>
            <div className="mt-auto grid gap-2">
              <Button as="button" type="submit" variant="skin" large disabled={busy}>
                {busy ? 'Going to Stripe…' : `Pay with Stripe · ${formatPrice(cart.total)}`}
              </Button>
              <button type="button" onClick={() => setView('cart')} className="min-h-11 font-bold underline">Back to cart</button>
            </div>
          </form>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 py-2">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-4 border-b border-skin-line py-4 last:border-b-0">
                  <img src={cover(item.id)} alt="" width="72" height="97" className="h-[97px] w-[72px] shrink-0 rounded-md border-2 border-skin-edge" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-skin text-lg leading-tight font-extrabold">{item.title}</p>
                    <p className="text-sm text-skin-muted">{item.author}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <Stepper value={item.quantity} onChange={(n) => setQuantity(item.id, n)} max={Math.min(10, item.stock || 1)} label={item.title} className="border-skin-edge" />
                      <p className="font-extrabold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="min-h-9 self-start text-sm font-bold text-skin-muted underline hover:text-skin-danger">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="grid gap-3 border-t-2 border-skin-line p-5">
              <p className="flex justify-between text-xl font-extrabold"><span>Total</span><span>{formatPrice(cart.total)}</span></p>
              <p className="text-sm text-skin-muted">Shipping address comes next, then you pay securely on Stripe (test mode).</p>
              <Button as="button" type="button" variant="skin" large onClick={() => setView('checkout')}>Checkout</Button>
              <button type="button" onClick={close} className="min-h-11 font-bold underline">Keep shopping</button>
            </footer>
          </>
        )}
      </div>
    </dialog>
  )
}
