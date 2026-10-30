// A controlled component: it keeps NO state of its own.
// The parent owns the number (value) and hands over a function (onChange)
// that the buttons call with the new number. The parent re-renders, passes the
// new value back down, and that's what shows up on screen.
// className is for the colours, so each page can dress it differently.
export default function Stepper({ value, onChange, min = 1, max = 10, label, className = '' }) {
  const btn =
    'grid size-10 place-items-center text-xl font-bold leading-none disabled:cursor-not-allowed disabled:opacity-35 pointer-coarse:size-11'

  return (
    <div role="group" aria-label={`Copies of ${label}`} className={`inline-flex items-center rounded-full border-2 ${className}`}>
      <button type="button" aria-label="One less copy" disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        &minus;
      </button>
      <output aria-live="polite" className="min-w-7 text-center text-base font-extrabold">
        {value}
      </output>
      <button type="button" aria-label="One more copy" disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
        +
      </button>
    </div>
  )
}
