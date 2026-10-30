import { useEffect, useRef, useState } from 'react'
import { authClient } from '../../lib/authClient'
import { useShop } from '../../context/ShopContext'
import Button from '../../shared/Button'
import { useSkin } from '../../context/SkinContext'
import { voices } from '../../data/themes'

const inputCls = 'skin-input min-h-12 w-full px-3 py-2.5 text-base'

// Sign in / create account, in a native <dialog> (the browser handles focus trapping and the Escape key for us).
// The real work is done by Better Auth: authClient.signIn.email / signUp.email talk to /api/auth/* on the server,
// the server sets the session cookie, and authClient.useSession() (in ShopContext) updates the whole UI.
export default function AuthDialog() {
  const { authMode, openAuth, closeAuth, notify } = useShop()
  const ref = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const signup = authMode === 'signup'
  const icon = (voices[useSkin()] ?? voices.home).icon

  // open / close the <dialog> element whenever authMode changes
  useEffect(() => {
    const dialog = ref.current
    if (authMode && !dialog.open) dialog.showModal()
    if (!authMode && dialog.open) dialog.close()
    setError('')
  }, [authMode])

  async function handleSubmit(e) {
    e.preventDefault()
    const { name, email, password } = Object.fromEntries(new FormData(e.currentTarget))
    setBusy(true)
    setError('')
    // Better Auth returns { data, error } instead of throwing
    const { error: authError } = signup
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })
    setBusy(false)
    if (authError) {
      setError(authError.message || 'That did not work. Please check your details.')
      return
    }
    notify(signup ? 'Welcome to GlobalBooks!' : 'Welcome back!')
    closeAuth()
  }

  return (
    <dialog
      ref={ref}
      onClose={closeAuth}
      onClick={(e) => e.target === ref.current && closeAuth()} // click on the dark backdrop closes it
      aria-labelledby="auth-title"
      className="popup skin-card m-auto w-[min(440px,calc(100vw-2rem))] overflow-hidden p-0 backdrop:bg-ink/60"
    >
      {/* a stripe of the shelf's colours along the top */}
      <div aria-hidden="true" className="h-3 bg-skin-pop" />
      <form onSubmit={handleSubmit} className="grid gap-4 p-6 sm:p-8">
        <p className="text-5xl" aria-hidden="true">{icon}</p>
        <h2 id="auth-title" className="font-skin text-4xl font-extrabold tracking-[-0.03em]">
          {signup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-skin-muted">
          {signup ? 'Save books, fill a cart and track your orders.' : 'Sign in to use your cart, wishlist and orders.'}
        </p>

        {signup && (
          <label className="grid gap-1 font-medium">
            Your name
            <input name="name" required autoComplete="name" className={inputCls} />
          </label>
        )}
        <label className="grid gap-1 font-medium">
          Email
          <input type="email" name="email" required autoComplete="email" inputMode="email" className={inputCls} />
        </label>
        <label className="grid gap-1 font-medium">
          Password {signup && <span className="text-sm font-normal text-skin-muted">(at least 8 characters)</span>}
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete={signup ? 'new-password' : 'current-password'}
            className={inputCls}
          />
        </label>

        <p role="alert" className="min-h-6 font-medium text-skin-danger">{error}</p>

        <Button as="button" type="submit" variant="skin" large disabled={busy}>
          {busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'}
        </Button>
        <p className="text-center">
          {signup ? 'Already have an account? ' : 'New here? '}
          <button type="button" onClick={() => openAuth(signup ? 'signin' : 'signup')} className="font-bold text-skin-link underline">
            {signup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <button type="button" onClick={closeAuth} className="mx-auto text-sm text-skin-muted underline">
          Close
        </button>
      </form>
    </dialog>
  )
}
