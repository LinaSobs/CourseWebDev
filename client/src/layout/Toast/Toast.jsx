import { useNotice } from '../../context/ShopContext'

// A short message at the bottom of the screen ("Added to cart", errors...). aria-live makes screen readers say it too.
// It wears the colours of the shelf you're on, and slides up when it appears.
export default function Toast() {
  const { notice, noticeTone } = useNotice()
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-[300] grid place-items-center px-4">
      {notice && (
        <p
          key={notice}
          className="skin-btn flex animate-rise-in items-center gap-2.5 border-2 border-skin-pop px-5 py-3 text-center font-bold shadow-lg motion-reduce:animate-none"
        >
          <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-skin-pop text-sm text-skin-pop-ink">{noticeTone === 'error' ? '!' : '✓'}</span>
          {notice}
        </p>
      )}
    </div>
  )
}
