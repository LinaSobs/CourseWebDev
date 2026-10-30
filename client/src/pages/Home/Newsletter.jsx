import { useState } from 'react'
import { api } from '../../lib/api'
import Container from '../../shared/Container'
import Button from '../../shared/Button'

const isValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export default function Newsletter() {
  // what's typed in the box right now
  const [email, setEmail] = useState('')
  // 'idle' = nothing yet, 'error' = bad email, 'saving' = waiting for the server, 'failed' = server problem, 'done' = signed up
  const [status, setStatus] = useState('idle')

  // runs on every keystroke. Also clears the old error as soon as they start fixing it
  function handleChange(e) {
    setEmail(e.target.value)
    if (status !== 'idle') setStatus('idle')
  }

  // runs when they click out of the box. Only complains if they actually typed something
  function handleBlur() {
    if (email.trim() && !isValid(email)) setStatus('error')
  }

  async function handleSubmit(e) {
    // stop the browser from doing its own submit, we handle it here
    e.preventDefault()

    if (!isValid(email)) {
      setStatus('error')
      return
    }

    // send it to our API, which saves it in the newsletter_subscribers table
    setStatus('saving')
    try {
      await api('/newsletter', { method: 'POST', body: { email } })
      setStatus('done')
      setEmail('')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <section className="relative isolate overflow-hidden bg-linear-to-br from-[#cfe8ff] via-[#e3f2ff] to-[#ffd9d5] py-16 text-ink dark:from-[#142a45] dark:via-[#10223a] dark:to-[#33222a] md:py-20">
      {/* soft circles for a bit of depth */}
      <div aria-hidden="true" className="absolute -top-16 -left-10 -z-10 size-56 rounded-full bg-sun/30 blur-sm" />
      <div aria-hidden="true" className="absolute -right-16 -bottom-20 -z-10 size-72 rounded-full bg-mint/25 blur-sm" />
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 sm:items-center">
        <div>
          <h2 className="t-section">Get a book deal every Friday</h2>
          <p className="t-lede mt-3">One email a week. Unsubscribe whenever you like.</p>
        </div>
        <div>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex max-w-[520px] gap-2 rounded-full bg-skin-surface p-2"
          >
            <input
              type="email"
              name="subscribe"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Email address"
              aria-label="Email address"
              aria-invalid={status === 'error'}
              aria-describedby="newsletter-msg"
              autoComplete="email"
              inputMode="email"
              className="min-w-0 flex-1 bg-transparent px-4 text-lg text-ink outline-none"
            />
            <Button as="button" type="submit" variant="skin" large disabled={status === 'saving'}>
              {status === 'saving' ? 'Saving…' : 'Subscribe'}
            </Button>
          </form>

          {/* one spot for feedback, so screen readers hear it too */}
          <p id="newsletter-msg" role="status" aria-live="polite" className={`mt-3 min-h-6 px-4 text-base font-medium ${status === 'done' ? 'animate-pop motion-reduce:animate-none' : ''}`}>
            {status === 'error' && 'That email doesn\u2019t look right. Mind checking it?'}
            {status === 'failed' && 'Something went wrong on our side. Please try again in a moment.'}
            {status === 'done' && 'You\u2019re in! Your first deals land this Friday.'}
          </p>
        </div>
      </Container>
    </section>
  )
}
