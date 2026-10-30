import { useEffect, useState } from 'react'

// How many cards appear first, and how many more each press of "More" adds.
export const PAGE_SIZE = 5

// Keeps track of how many items are showing. Pass `resetKey` (a filter, a search, a tab...) and the count
// goes back to 5 whenever it changes, so a new search never starts half-open.
// `pinId` (optional): an item that must be on screen even if it is further down (for example a paper opened from search).
export function useLoadMore(items, resetKey = '', step = PAGE_SIZE, pinId = null) {
  const [count, setCount] = useState(step)
  useEffect(() => setCount(step), [resetKey, step])
  const at = pinId == null ? -1 : items.findIndex((i) => i.id === pinId)
  const needed = at < 0 ? 0 : Math.ceil((at + 1) / step) * step
  const shownCount = Math.max(count, needed)
  // remember the bigger number, so the list stays open after the pin is let go
  useEffect(() => {
    if (needed > count) setCount(needed)
  }, [needed, count])
  return {
    shown: items.slice(0, shownCount),
    total: items.length,
    hasMore: shownCount < items.length,
    more: () => setCount(shownCount + step),
  }
}

// The "More" button. Shows nothing when there is nothing left to show.
export default function LoadMore({ hasMore, onMore, shown, total, step = PAGE_SIZE, className = '' }) {
  if (total <= step) return null
  const left = total - shown
  return (
    <div className={`mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 ${className}`}>
      {hasMore && (
        <button type="button" onClick={onMore} className="btn btn-lg skin-btn skin-btn-pop">
          More
          <span className="sr-only"> ({Math.min(step, left)} more to show)</span>
        </button>
      )}
      <p aria-live="polite" className="t-meta font-bold">
        Showing {shown} of {total}
      </p>
    </div>
  )
}
