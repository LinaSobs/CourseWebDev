import { formatDate, formatPrice } from '../../lib/format'
import PurchasedBook from '../../shared/PurchasedBook/PurchasedBook'

// Small number card ("3 saved books"). Lives inside a <dl> on the page.
export function Stat({ value, label, icon }) {
  return (
    <div className="skin-card skin-card--flat px-5 py-4">
      <dt className="sr-only">{label}</dt>
      <dd className="m-0">
        <p className="font-skin text-3xl leading-none font-extrabold md:text-4xl">
          <span aria-hidden="true" className="mr-1.5 text-2xl">{icon}</span>
          {value}
        </p>
        <p className="mt-1.5 text-sm font-bold text-skin-muted">{label}</p>
      </dd>
    </div>
  )
}

export function Empty({ icon, children }) {
  return (
    <p className="skin-card skin-card--flat skin-empty px-5 py-6 text-lg">
      <span aria-hidden="true" className="mr-2">{icon}</span>
      {children}
    </p>
  )
}

// Round avatar with the person's initials; colour comes from the name,
// so it stays the same every visit.
const avatarColours = ['bg-coral', 'bg-sun', 'bg-mint']
export function Avatar({ name, size = 'md' }) {
  const initials =
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  const colour =
    avatarColours[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % avatarColours.length]
  return (
    <span
      aria-hidden="true"
      className={`skin-avatar skin-avatar--${size} ${colour}`}
    >
      {initials}
    </span>
  )
}

const statusLabel = { paid: 'Paid', pending: 'Awaiting payment', expired: 'Not paid', demo: 'Demo order' }

export function OrderCard({ o, onBuyAgain, busy = false }) {
  return (
    <li className="skin-card skin-card--flat skin-order p-5">
      <div className="skin-order__header flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-skin text-xl font-extrabold">Order #{o.id}</h3>
        <p className="flex items-center gap-2 text-sm text-skin-muted">
          {formatDate(o.createdAt)}
          <span className="rounded-full bg-skin-pop px-3 py-0.5 text-xs font-extrabold tracking-wide text-skin-pop-ink uppercase">
            {statusLabel[o.status] ?? o.status}
          </span>
        </p>
      </div>

      <ul className="skin-order__items mt-3 divide-y divide-skin-line">
        {o.items.map((i) => (
          <li key={i.bookId} className="flex justify-between gap-4 py-2">
            <span>
              {i.title} <span className="text-skin-muted">× {i.quantity}</span>
            </span>
            <span>{formatPrice(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex justify-between font-extrabold">
        <span>Total</span>
        <span>{formatPrice(o.total)}</span>
      </p>

      <div className="mt-4 border-t border-skin-line pt-3">
        <p className="text-sm text-skin-muted">Tap a book to see it celebrate again.</p>
        <div className="flex flex-wrap gap-4 pt-16 pb-3">
          {o.items.map((i) => (
            <PurchasedBook
              key={i.bookId}
              size="sm"
              auto={false}
              book={{ id: i.bookId, title: i.title }}
            />
          ))}
        </div>
      </div>

      <div className="skin-order__footer flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-skin-muted">
          Shipping to {o.shipTo.name}, {o.shipTo.country}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => onBuyAgain(o.items)}
          className="btn skin-btn skin-btn-soft min-h-11"
        >
          {busy ? 'Adding…' : 'Buy again'}
        </button>
      </div>
    </li>
  )
}