'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// A strip of tabs with ONE highlight that slides to whichever tab is active.
// Used in the header as the Shelf bar (the audience tabs, links) and on the account page.
//
//   items:    [{ id, label, icon?, count?, href? }]   an item with href is a link, otherwise a button
//   activeId: the id that gets the highlight (null/unknown = no highlight)
//   tone:     'blue' or 'coral'
//   onSelect: called with (item) when a tab is clicked or selected with the keyboard
//   mode:     'nav' (links / filter buttons, the default) or 'tabs' (real ARIA tabs that switch a panel
//             with id panel-<id>; arrow keys / Home / End move focus and selection)
//
//   flyouts:  { [tabId]: [{ id, label, icon?, count?, href }] }   optional drop-down menus (the sections of a shelf).
//             Mouse: pointing at a tab opens its list under it; the list stays open while the pointer is on the tab OR on the
//             list, and closes a moment after it leaves both.
//             Touch / keyboard: click or tap the HIGHLIGHTED tab to open or close its list (a chevron on the tab shows it has one).
//             The list grows out of the tab and its items slide in one by one (see .flyout in Header.css); closing plays too.
//   flyoutCurrentId: the section that is picked right now in the highlighted tab's list (gets the tick)
//   onFlyoutSelect: called with (tab, item, event) when a flyout link is clicked
//
// On narrow screens the strip scrolls sideways, fades out at the edges, and keeps the active tab in view.

// useLayoutEffect warns during SSR; on the server it degrades to useEffect (a no-op there anyway)
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const TONES = {
  blue: { pill: 'bg-skin-accent', on: 'text-white' },
  coral: { pill: 'bg-coral', on: 'text-ink' },
}

const SIZES = {
  md: 'min-h-11 px-4 text-base',
  sm: 'min-h-10 px-3.5 text-sm',
}

const FLY_W = 256 // px width of a hover menu
const FLY_CLOSE_DELAY = 320 // ms the menu waits after the pointer leaves, so crossing the small gap does not close it
const FLY_EXIT_MS = 220 // length of the closing animation (.flyout[data-state="closing"] in Header.css), before --dur-scale
const FADE = 28 // px of fade at a scrollable edge
const SLOP = 1 // px of tolerance for "at the edge" / "needs scrolling"

function samePill(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height
}

function SlidingTabs({
  items,
  activeId,
  label,
  tone = 'blue',
  size = 'md',
  mode = 'nav',
  onSelect,
  flyouts,
  flyoutCurrentId,
  onFlyoutSelect,
}) {
  const listRef = useRef(null)
  const tabRefs = useRef(new Map())

  const [pill, setPill] = useState(null) // where the highlight sits: { left, top, width, height }
  const [edges, setEdges] = useState({ start: false, end: false }) // is there more to scroll on each side?
  const [scrollable, setScrollable] = useState(false)
  const [focused, setFocused] = useState(false)
  const [fly, setFly] = useState(null) // the menu that SHOULD be open: { id, left, top }
  const [shown, setShown] = useState(null) // the menu on screen. It stays a little longer than `fly` so the closing animation can play
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef(0)
  const [animate, setAnimate] = useState(false) // off for the very first placement, so it doesn't fly in from the corner

  const t = TONES[tone] ?? TONES.blue
  const s = SIZES[size] ?? SIZES.md
  const isTabs = mode === 'tabs'

  // ---- hover menus ---------------------------------------------------------

  const cancelClose = useCallback(() => window.clearTimeout(closeTimer.current), [])
  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setFly(null), FLY_CLOSE_DELAY)
  }, [])
  const openFly = useCallback((id) => {
    const el = tabRefs.current.get(id)
    if (!el) return
    window.clearTimeout(closeTimer.current)
    const r = el.getBoundingClientRect()
    // fixed position (the strip scrolls sideways and would clip a menu inside it); kept inside the screen
    setFly({ id, left: Math.max(8, Math.min(r.left, window.innerWidth - FLY_W - 8)), top: r.bottom })
  }, [])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  // keep the menu on screen while it plays its closing animation, then remove it
  useEffect(() => {
    if (fly) {
      setShown(fly)
      setClosing(false)
      return
    }
    if (!shown) return
    setClosing(true)
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-scale')) || 1
    const id = window.setTimeout(() => {
      setShown(null)
      setClosing(false)
    }, FLY_EXIT_MS * scale + 60)
    return () => window.clearTimeout(id)
  }, [fly, shown])

  // an open menu would drift away from its tab, so scrolling, resizing or Escape closes it.
  // Tapping anywhere else closes it too (touch screens have no "pointer leaves").
  useEffect(() => {
    if (!fly) return
    const close = () => setFly(null)
    const onKey = (e) => e.key === 'Escape' && close()
    const onDown = (e) => {
      if (e.target.closest?.('[data-flyout]') || tabRefs.current.get(fly.id)?.contains(e.target)) return
      close()
    }
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('scroll', close)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [fly])

  // ---- measurement ---------------------------------------------------------

  const updatePill = useCallback(() => {
    // offsetLeft/Top are relative to the list's padding box, which is also what
    // an absolutely positioned child's `left: 0; top: 0` resolves against.
    const el = activeId == null ? null : tabRefs.current.get(activeId)
    setPill((prev) => {
      const next = el
        ? { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight }
        : null
      return samePill(prev, next) ? prev : next
    })
  }, [activeId])

  const updateEdges = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const overflowing = list.scrollWidth > list.clientWidth + SLOP
    setScrollable((prev) => (prev === overflowing ? prev : overflowing))
    setEdges((prev) => {
      const start = overflowing && list.scrollLeft > SLOP
      const end = overflowing && list.scrollLeft + list.clientWidth < list.scrollWidth - SLOP
      return prev.start === start && prev.end === end ? prev : { start, end }
    })
  }, [])

  // one path for every reason to re-measure: render, resize, font load, scroll
  const sync = useCallback(() => {
    updatePill()
    updateEdges()
  }, [updatePill, updateEdges])

  useIsomorphicLayoutEffect(sync, [sync, items])

  // sizes change when the window is resized or the web font arrives, so measure again then
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const ro = new ResizeObserver(sync)
    ro.observe(list)

    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) sync()
    })

    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [sync])

  // turn the slide animation on one frame after the first placement
  useEffect(() => {
    if (!pill || animate) return
    let inner
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [pill, animate])

  // keep the active tab in view (phones), but only when it is actually out of view
  useEffect(() => {
    const list = listRef.current
    const el = activeId == null ? null : tabRefs.current.get(activeId)
    if (!list || !el || list.scrollWidth <= list.clientWidth + SLOP) return

    const start = el.offsetLeft
    const end = start + el.offsetWidth
    const viewStart = list.scrollLeft
    const viewEnd = viewStart + list.clientWidth
    if (start >= viewStart && end <= viewEnd) return

    const max = list.scrollWidth - list.clientWidth
    const target = Math.min(Math.max(start - (list.clientWidth - el.offsetWidth) / 2, 0), max)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' })
  }, [activeId, items.length])

  // ---- keyboard (real tabs only) -------------------------------------------

  const handleKeyDown = (event) => {
    if (!isTabs) return
    const tabs = items.filter((item) => !item.href)
    if (tabs.length < 2) return

    const index = tabs.findIndex((item) => tabRefs.current.get(item.id) === document.activeElement)
    if (index === -1) return

    let next
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % tabs.length
        break
      case 'ArrowLeft':
        next = (index - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = tabs.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const item = tabs[next]
    onSelect?.(item)
    tabRefs.current.get(item.id)?.focus()
  }

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
  }

  // ---- render --------------------------------------------------------------

  const hasActiveTab = items.some((item) => !item.href && item.id === activeId)
  const firstTabId = isTabs ? items.find((item) => !item.href)?.id : undefined

  // only mask when it does something, and never while a tab is focused (it would clip the focus ring)
  const mask =
    scrollable && !focused
      ? `linear-gradient(to right, ${edges.start ? 'transparent' : '#000'} 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), ${edges.end ? 'transparent' : '#000'} 100%)`
      : undefined

  const flyItems = shown ? flyouts?.[shown.id] : null
  const flyTab = shown ? items.find((i) => i.id === shown.id) : null
  // rendered next to the page (not inside the header) so no row can clip it, still inside data-skin so it wears the shelf's colours
  const flyTarget = flyItems ? document.querySelector('[data-skin]') ?? document.body : null

  return (
    <>
    <div
      ref={listRef}
      role={isTabs ? 'tablist' : 'group'}
      aria-label={label}
      onScroll={updateEdges}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className="relative flex gap-1 overflow-x-auto overscroll-x-contain px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* the sliding highlight sits under the labels */}
      {pill && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 rounded-full ${t.pill} ${
            animate ? 'transition-[transform,width,height] duration-[calc(300ms*var(--dur-scale))] ease-out motion-reduce:transition-none' : ''
          }`}
          style={{
            width: pill.width,
            height: pill.height,
            transform: `translate3d(${pill.left}px, ${pill.top}px, 0)`,
          }}
        />
      )}

      {items.map((item) => {
        const active = item.id === activeId
        // roving tabindex: exactly one tab is reachable with Tab
        const tabbable = !isTabs || active || (!hasActiveTab && item.id === firstTabId)

        const cls = [
          'relative z-10 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold',
          'transition-colors motion-reduce:transition-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
          s,
          active ? t.on : fly?.id === item.id ? 'bg-ink/5 text-ink' : 'text-ink/75 hover:bg-ink/5 hover:text-ink',
        ].join(' ')

        // tabs that have a hover menu: open it on mouse enter, close it (after a short delay) on leave
        const flyProps = flyouts?.[item.id]
          ? {
              onPointerEnter: (e) => e.pointerType === 'mouse' && openFly(item.id),
              onPointerLeave: (e) => e.pointerType === 'mouse' && scheduleClose(),
              'aria-haspopup': 'true',
              'aria-expanded': fly?.id === item.id,
            }
          : null

        const hasFly = Boolean(flyouts?.[item.id])
        const inner = (
          <>
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            {item.label}
            {item.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-xs font-bold tabular-nums ${
                  active ? 'bg-current/20' : 'bg-ink/10'
                }`}
              >
                {item.count}
              </span>
            )}
            {/* the highlighted tab shows a chevron: it has sections, and clicking / tapping it opens them */}
            {active && hasFly && (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`-mr-1 size-4 transition-transform duration-[calc(300ms*var(--dur-scale))] ease-out motion-reduce:transition-none ${fly?.id === item.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </>
        )

        const setRef = (el) => {
          if (el) tabRefs.current.set(item.id, el)
          else tabRefs.current.delete(item.id)
        }

        return item.href ? (
          <a
            key={item.id}
            ref={setRef}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => {
              // the highlighted tab is already open on its page, so a click opens its sections instead.
              // A mouse is already pointing at it (the menu opened on hover), so only touch and keyboard toggle it.
              if (active && hasFly) {
                e.preventDefault()
                if (e.nativeEvent.pointerType === 'mouse') openFly(item.id)
                else if (fly?.id === item.id) setFly(null)
                else openFly(item.id)
                return
              }
              setFly(null)
              onSelect?.(item)
            }}
            className={cls}
            {...flyProps}
          >
            {inner}
          </a>
        ) : (
          <button
            key={item.id}
            ref={setRef}
            type="button"
            {...(isTabs
              ? {
                  role: 'tab',
                  id: `tab-${item.id}`,
                  tabIndex: tabbable ? 0 : -1,
                  'aria-selected': active,
                  'aria-controls': `panel-${item.id}`,
                }
              : { 'aria-pressed': active })}
            onClick={() => onSelect?.(item)}
            className={cls}
          >
            {inner}
          </button>
        )
      })}
    </div>

    {flyItems &&
      flyTarget &&
      createPortal(
        <div
          key={shown.id}
          data-flyout=""
          data-state={closing ? 'closing' : 'open'}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          style={{ position: 'fixed', left: shown.left, top: shown.top, width: FLY_W, maxWidth: 'calc(100vw - 16px)' }}
          className="flyout z-[70] pt-2"
        >
          <ul aria-label={`${flyTab?.label} sections`} className="skin-card grid max-h-[70dvh] gap-0.5 overflow-y-auto p-2">
            {flyItems.map((sub, i) => {
              const current = shown.id === activeId && sub.id === flyoutCurrentId
              return (
                <li key={sub.id} style={{ '--i': i }}>
                  <a
                    href={sub.href}
                    aria-current={current ? 'true' : undefined}
                    onClick={(e) => {
                      setFly(null)
                      onFlyoutSelect?.(flyTab, sub, e)
                    }}
                    className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink transition-colors hover:bg-sun focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue motion-reduce:transition-none ${current ? 'bg-coral' : ''}`}
                  >
                    {sub.icon && <span aria-hidden="true">{sub.icon}</span>}
                    {sub.label}
                    {sub.count !== undefined && <span className="badge ml-auto bg-ink/10 tabular-nums">{sub.count}</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>,
        flyTarget,
      )}
    </>
  )
}
export default memo(SlidingTabs)
