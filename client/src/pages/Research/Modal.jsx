import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// How many dialogs are open right now. The page behind stays locked (class .modal-open, see pages/Research/Research.css) until the last one closes.
let openDialogs = 0

// A dialog that behaves properly for keyboard and screen-reader users:
//  - the rest of the page is made inert (can't be tabbed to or read) while it is open, plus Tab is wrapped inside it
//  - Escape closes it, a click on the dimmed background closes it
//  - focus moves in when it opens (to initialFocus, or the first control) and returns to whatever opened it when it closes
//  - the page behind stops scrolling
export default function Modal({ label, onClose, children, initialFocus, align = 'center', className = '' }) {
  const panel = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement // remember who opened us
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    const scrollY = window.scrollY
    openDialogs += 1
    document.body.classList.add('modal-open')

    const target = (initialFocus?.current ?? panel.current?.querySelector(FOCUSABLE)) || panel.current
    target?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return e.preventDefault()
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || !panel.current.contains(document.activeElement))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !panel.current.contains(document.activeElement))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      root?.removeAttribute('inert')
      openDialogs -= 1
      if (openDialogs === 0) document.body.classList.remove('modal-open')
      window.scrollTo({ top: scrollY, behavior: 'instant' })
      if (opener && document.contains(opener)) opener.focus() // back to the trigger
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const place = align === 'top' ? 'items-start' : 'items-center'
  // same dimmed backdrop as the cart drawer (.rb-dialog in Research.css), same white rounded panel as every card on the site
  return createPortal(
    <div className={`rb-dialog fixed inset-0 z-[100] flex justify-center ${place} p-0 md:p-8`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={`max-h-dvh w-full animate-rise-in overflow-y-auto bg-skin-surface text-ink motion-reduce:animate-none md:max-h-[calc(100dvh-4rem)] md:rounded-[28px] md:shadow-[0_24px_60px_rgba(18,38,63,0.25)] ${className}`}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// The title bar of every dialog on this page: the title on the left, a close pill on the right.
export function DialogBar({ title, onClose, closeLabel = 'Close' }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-skin-surface/95 px-5 py-3 backdrop-blur md:rounded-t-[28px]">
      <h2 className="t-title">{title}</h2>
      {onClose && (
        <button type="button" onClick={onClose} className="btn skin-btn skin-btn-soft">
          <span aria-hidden="true">✕</span>
          {closeLabel}
        </button>
      )}
    </div>
  )
}
