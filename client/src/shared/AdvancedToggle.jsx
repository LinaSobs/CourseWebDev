// The "Advanced search" button. It only opens and closes a panel; the page that uses it owns the open/closed state.
// `count` is how many filters are switched on inside the panel, so you can still tell when the panel is closed.
export default function AdvancedToggle({ open, onToggle, count = 0, controls, label = 'Advanced search', className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      className={`chip gap-2 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </svg>
      {label}
      {count > 0 && (
        <span className="rounded-full bg-ink px-2 text-xs font-extrabold text-paper">
          {count}
          <span className="sr-only"> filter{count === 1 ? '' : 's'} on</span>
        </span>
      )}
      <span aria-hidden="true" className={`text-xs transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}>▾</span>
    </button>
  )
}
