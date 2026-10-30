import { useEffect } from 'react'
import { isScrollLocked } from './useCategory'

const STATES = ['none', 'tabs']
const TOP_ZONE = 80   // below this scrollY we always show everything
const STEP = 6        // px of net movement needed to advance a step

/**
 * Drives `data-tuck` on the header element directly. No React state, no
 * re-render — so scrolling never re-renders the cart badge, nav, or either
 * the Shelf bar. The CSS in layout/Header/Header.css does all the work.
 *
 * `pinned` = the visitor pinned the menu: nothing is ever tucked away, every row stays visible.
 */
export function useHeaderScroll(headerRef, pinned = false) {
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    if (!el.dataset.tuck) el.dataset.tuck = 'none'
    if (pinned) {
      el.dataset.tuck = 'none'
      return // no scroll listener at all while pinned
    }

    let last = window.scrollY
    let raf = 0
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      raf = requestAnimationFrame(() => {
        ticking = false
        const y = window.scrollY

        if (y < TOP_ZONE) {
          if (el.dataset.tuck !== 'none') el.dataset.tuck = 'none'
          last = y
          return
        }
        // we started a smooth scroll ourselves, or a drawer/dialog is open
        if (isScrollLocked()) {
          last = y
          return
        }

        const dy = y - last
        if (Math.abs(dy) < STEP) return

        const idx = STATES.indexOf(el.dataset.tuck)
        const next =
          dy > 0
            ? STATES[Math.min(idx + 1, STATES.length - 1)]
            : STATES[Math.max(idx - 1, 0)]

        if (next !== el.dataset.tuck) el.dataset.tuck = next
        last = y
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [headerRef, pinned])
}