import { useState } from 'react'
import { useCatalog } from '../../context/CatalogContext'
import { api } from '../../lib/api'
import Container from '../../shared/Container'
import Button from '../../shared/Button'

const channels = [
  { href: 'https://wa.me/491234567890?text=Hi%20GlobalBooks%2C%20I%20need%20help%20with%3A%20', name: 'WhatsApp', text: 'Fastest. Opens a chat with your message started.' },
  { href: 'mailto:hello@globalbooks.example', name: 'Email', text: 'Best for orders and longer questions.' },
  { href: 'tel:+491234567890', name: 'Call', text: 'Monday to Friday, 9:00 to 17:00 (CET)' },
]

const topics = [
  { id: 'pick', label: 'Help me pick a book' },
  { id: 'order', label: 'Place or bulk order' },
  { id: 'track', label: 'Track or change an order' },
  { id: 'help', label: 'Shipping or returns' },
  { id: 'other', label: 'Something else' },
]

const inputCls = 'skin-input min-h-11 w-full px-3 py-2.5 text-base'

// one label + input pair. `show` decides whether it's on screen. I use `hidden`
// instead of not rendering it, so whatever someone already typed isn't lost
// if they flip between topics.
function Field({ label, wide = false, show = true, children }) {
  return (
    <label className={`${show ? 'grid' : 'hidden'} min-w-0 gap-1 text-[0.95rem] font-medium ${wide ? 'sm:col-span-full' : ''}`}>
      {label}
      {children}
    </label>
  )
}

export default function Contact() {
  const { books } = useCatalog()
  // which "what do you need?" option is picked ('' = nothing yet)
  const [topic, setTopic] = useState('')
  // 'idle' -> 'sending' -> 'sent' (or 'failed'); drives the button and the message under it
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const is = (...ids) => ids.includes(topic)

  // Send the form to our API instead of opening the visitor's email app.
  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    // every input has a name=, so FormData gives us { topic, name, email, message, ...topic-specific fields }
    const { topic: topicLabel, name, email, message, source, ...details } = Object.fromEntries(new FormData(form))
    setStatus('sending')
    try {
      await api('/contact', { method: 'POST', body: { topic: topicLabel, name, email, message, details } })
      setStatus('sent')
      form.reset()
      setTopic('')
    } catch (err) {
      setError(err.message)
      setStatus('failed')
    }
  }

  return (
    <section id="contact" className="contact-timeline bg-skin-deep py-16 text-skin-deep-ink md:py-28">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[1fr_1.25fr] md:items-start md:gap-12">
        <div>
          <h2 className="t-section">Talk to a real person</h2>
          <p className="t-lede mt-4">
            Tell us what you need and we&apos;ll ask only what matters for that. Most replies arrive within one
            business day.
          </p>
          <ul className="mt-5 grid gap-2.5">
            {channels.map((c) => (
              <li key={c.name}>
                <a
                  href={c.href}
                  className="flex min-h-11 flex-col justify-center rounded-skin border-2 border-skin-deep-line bg-skin-deep-soft px-4 py-3 transition hover:-translate-y-0.5"
                >
                  <strong className="font-skin text-2xl text-skin-deep-pop">{c.name}</strong>
                  <span className="text-base text-skin-deep-muted">{c.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="skin-card p-6 sm:p-6"
        >
          <fieldset className="mb-5 grid min-w-0 gap-2 sm:grid-cols-2">
            <legend className="mb-2 font-extrabold">1. What do you need?</legend>
            {topics.map((t) => (
              <label key={t.id} className="relative block">
                <input
                  type="radio"
                  name="topic"
                  value={t.label}
                  required
                  checked={topic === t.id}
                  onChange={() => {
                    setTopic(t.id)
                    setStatus('idle')
                  }}
                  className="peer absolute size-px opacity-0"
                />
                <span className="flex min-h-11 cursor-pointer items-center rounded-[10px] border-2 border-skin-line px-4 py-1 font-medium peer-checked:border-skin-edge peer-checked:bg-skin-pop peer-checked:font-bold peer-checked:text-skin-pop-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-skin-link">
                  {t.label}
                </span>
              </label>
            ))}
          </fieldset>

          {/* nothing below shows up until a topic is picked */}
          <p className={`${topic ? 'block' : 'hidden'} mb-3 font-extrabold`}>2. A few details</p>
          <div className={`${topic ? 'grid' : 'hidden'} gap-3 sm:grid-cols-2`}>
            <Field label="Your name">
              <input name="name" required autoComplete="name" className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" name="email" required autoComplete="email" inputMode="email" className={inputCls} />
            </Field>

            <Field label="Who is it for?" show={is('pick')}>
              <select name="reader" className={inputCls}>
                <option value="">Choose</option>
                <option>A child (3 to 10)</option>
                <option>A teen (12+)</option>
                <option>An adult</option>
                <option>A student</option>
                <option>A scientist or researcher</option>
              </select>
            </Field>
            <Field label="Budget per book" show={is('pick')}>
              <select name="budget" className={inputCls}>
                <option value="">Any</option>
                <option>Under $15</option>
                <option>$15 to $25</option>
                <option>$25 to $40</option>
                <option>Over $40</option>
              </select>
            </Field>
            <Field label="What do they enjoy?" wide show={is('pick')}>
              <textarea name="interests" rows={3} placeholder="Space, animals, mysteries, history..." className={`${inputCls} resize-y`} />
            </Field>

            <Field label="Which book?" wide show={is('order')}>
              <select name="book" className={inputCls}>
                <option value="">Choose a book</option>
                {books.map((b) => (
                  <option key={b.id}>{b.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Copies" show={is('order')}>
              <input type="number" name="copies" min="1" inputMode="numeric" placeholder="1" className={inputCls} />
            </Field>
            <Field label="Country" show={is('order', 'help')}>
              <input name="country" autoComplete="country-name" className={inputCls} />
            </Field>
            <Field label="Order number" show={is('track', 'help')}>
              <input name="order_number" autoComplete="off" className={inputCls} />
            </Field>

            <Field label="Anything else we should know?" wide>
              <textarea name="message" rows={3} className={`${inputCls} resize-y`} />
            </Field>
          </div>

          <input type="hidden" name="source" value="GlobalBooks website" />
          <Button as="button" type="submit" variant="skin" large disabled={status === 'sending'} className={`${topic ? 'inline-flex' : 'hidden'} mt-4 w-full`}>
            {status === 'sending' ? 'Sending…' : 'Send to GlobalBooks'}
          </Button>
          <p role="status" className="mt-3 min-h-6 text-center font-medium">
            {status === 'sent' && 'Thanks! Your message is with us. We reply within one business day.'}
            {status === 'failed' && error}
          </p>
        </form>
      </Container>
    </section>
  )
}
