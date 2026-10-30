import { priceFilters } from '../../data/filters'

// `compact` is used inside the "Advanced search" panel: no outer margin, and the count is shown by the toolbar instead.
// Also controlled: Shelf owns `selected`, this just shows it and reports clicks.
// By default it shows the price options. The Kids Corner passes age options and its own label instead.
export default function PriceFilter({ selected, onChange, shown, total, theme, options = priceFilters, label = 'Filter by price', compact = false }) {
  return (
    <div className={`${compact ? '' : 'mb-8 md:mb-12'} flex flex-wrap items-center gap-2`}>
      <span className={`mr-2 ${theme.filterLabel}`}>{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={selected === f.id}
            onClick={() => onChange(f.id)}
            className="chip"
          >
            {f.label}
          </button>
        ))}
      </div>
      {!compact && (
        <p aria-live="polite" className={`sm:ml-auto ${theme.filterCount}`}>
          Showing {shown} of {total} books
        </p>
      )}
    </div>
  )
}
