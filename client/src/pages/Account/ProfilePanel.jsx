import { useEffect, useState } from 'react'
import { useShop } from '../../context/ShopContext'
import { authClient } from '../../lib/authClient'
import { formatDate } from '../../lib/format'
import Button from '../../shared/Button'

const inputCls = 'skin-input min-h-12 w-full px-3 py-2.5 text-base'

/* ── small primitives ──────────────────────────────────────── */

function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="skin-field">
      <label htmlFor={htmlFor} className="font-medium">
        {label}
        {hint && <span className="skin-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function InlineAlert({ message }) {
  return (
    <p role="alert" aria-live="polite" className="skin-alert">
      {message || '\u00A0'}
    </p>
  )
}

function PasswordField({ id, name, label, hint, autoComplete, value, onChange, ...rest }) {
  const [show, setShow] = useState(false)
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="skin-input-wrap">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={inputCls}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="skin-input-wrap__toggle"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </Field>
  )
}

/* ── password strength ─────────────────────────────────────── */

function scorePassword(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong']

function StrengthMeter({ value }) {
  const score = scorePassword(value)
  return (
    <div className="skin-meter" aria-live="polite">
      <div className="skin-meter__track">
        <div
          className="skin-meter__fill"
          data-score={score}
          style={{ width: `${(score / 4) * 100}%` }}
        />
      </div>
      <p className="text-sm text-skin-muted">{STRENGTH_LABELS[score]}</p>
    </div>
  )
}

/* ── Identity card ─────────────────────────────────────────── */

function IdentityForm({ user, notify }) {
  const [name, setName] = useState(user.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setName(user.name), [user.name])

  const clean = name.trim()
  const dirty = clean !== '' && clean !== user.name
  const looksLikeEmailPrefix =
    clean.toLowerCase() === user.email.split('@')[0].toLowerCase()

  async function submit(e) {
    e.preventDefault()
    if (!dirty || busy) return
    setBusy(true)
    setError('')
    const { error } = await authClient.updateUser({ name: clean })
    setBusy(false)
    if (error) setError(error.message || 'We could not save your name.')
    else notify('Your name is updated.')
  }

  return (
    <form
      onSubmit={submit}
      className="skin-glass-card grid content-start gap-4 p-5 md:p-6"
    >
      <h2 className="font-skin text-2xl font-extrabold">Your details</h2>

      <Field
        label="Your name"
        htmlFor="profile-name"
        hint={looksLikeEmailPrefix ? '(pick a friendlier one)' : undefined}
      >
        <input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          autoComplete="name"
          className={inputCls}
        />
      </Field>

      <Field label="Email" htmlFor="profile-email" hint="(used to sign in)">
        <input
          id="profile-email"
          value={user.email}
          readOnly
          aria-describedby="email-note"
          className={`${inputCls} opacity-70`}
        />
      </Field>
      <p id="email-note" className="-mt-2 text-sm text-skin-muted">
        This is how you sign in, so it can’t be changed here.
      </p>

      <InlineAlert message={error} />

      <div className="flex flex-wrap items-center gap-4">
        <Button
          as="button"
          type="submit"
          variant="skin"
          disabled={busy || !dirty}
          className="justify-self-start"
        >
          {busy ? 'Saving…' : 'Save name'}
        </Button>
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setName(user.name)
              setError('')
            }}
            className="min-h-11 font-bold text-skin-muted underline"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  )
}

/* ── Password card ─────────────────────────────────────────── */

function PasswordForm({ notify }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [next, setNext] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    const form = e.currentTarget
    const { current, next: nextPw, again } = Object.fromEntries(new FormData(form))
    if (nextPw !== again) return setError('The two new passwords are not the same.')
    if (nextPw === current)
      return setError('Please choose a password you have not used just now.')

    setBusy(true)
    setError('')
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: nextPw,
      revokeOtherSessions: true,
    })
    setBusy(false)
    if (error) return setError(error.message || 'We could not change your password.')
    form.reset()
    setNext('')
    notify('Password changed. Other devices were signed out.')
  }

  return (
    <form
      onSubmit={submit}
      className="skin-glass-card grid content-start gap-4 p-5 md:p-6"
    >
      <h2 className="font-skin text-2xl font-extrabold">Change password</h2>

      <PasswordField
        id="pw-current"
        name="current"
        label="Current password"
        autoComplete="current-password"
        required
      />

      <PasswordField
        id="pw-next"
        name="next"
        label="New password"
        hint="(at least 8 characters)"
        autoComplete="new-password"
        required
        minLength={8}
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      {next && <StrengthMeter value={next} />}

      <PasswordField
        id="pw-again"
        name="again"
        label="New password again"
        autoComplete="new-password"
        required
        minLength={8}
      />

      <InlineAlert message={error} />

      <Button
        as="button"
        type="submit"
        variant="skin"
        disabled={busy}
        className="justify-self-start"
      >
        {busy ? 'Changing…' : 'Change password'}
      </Button>
    </form>
  )
}

/* ── Meta card ─────────────────────────────────────────────── */

function AccountMeta({ user }) {
  const memberSince = user.createdAt ? formatDate(user.createdAt) : '—'
  const verified = user.emailVerified

  return (
    <section className="skin-glass-card grid content-start gap-3 p-5 md:p-6">
      <h2 className="font-skin text-2xl font-extrabold">Account</h2>
      <dl className="skin-meta text-sm">
        <dt>Member since</dt>
        <dd>{memberSince}</dd>
        <dt>Email</dt>
        <dd className="truncate">{user.email}</dd>
        <dt>Status</dt>
        <dd>
          {verified === true
            ? 'Verified'
            : verified === false
              ? 'Not verified'
              : '—'}
        </dd>
      </dl>
    </section>
  )
}

/* ── Panel ─────────────────────────────────────────────────── */

export default function ProfilePanel({ user }) {
  const { notify } = useShop()
  return (
    <div
      role="tabpanel"
      id="panel-profile"
      aria-labelledby="tab-profile"
      tabIndex={-1}
      className="skin-glass-stage"
    >
      <p className="skin-glass-lede">
        A few details we keep about you. Everything here saves straight away.
      </p>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="grid gap-6">
          <IdentityForm user={user} notify={notify} />
          <AccountMeta user={user} />
        </div>
        <PasswordForm notify={notify} />
      </div>
    </div>
  )
}