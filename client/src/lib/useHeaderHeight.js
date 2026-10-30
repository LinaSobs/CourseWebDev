import { useLayoutEffect } from 'react'

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? () => {} : useLayoutEffect

/**
 * Measures the header and writes the LARGEST height it reaches to --header-h on
 * <html>. Anchor jumps therefore land safely below the header in every state:
 * bar visible, bar collapsed, safe-area inset, web-font reflow, "Kids"
 * badge wrapping. Uses max (not current) so we write to the DOM at most once
 * per distinct height and never fight the row transition.
 */
export function useHeaderHeight(headerRef) {
  useIsomorphicLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return

    let max = 0
    const write = () => {
      const h = el.offsetHeight
      if (h > max) {
        max = h
        document.documentElement.style.setProperty('--header-h', `${h}px`)
      }
    }

    const ro = new ResizeObserver(write)
    ro.observe(el)
    write()
    return () => ro.disconnect()
  }, [headerRef])
}