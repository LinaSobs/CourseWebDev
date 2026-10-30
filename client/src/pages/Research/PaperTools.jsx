// The strip above the paper list: five numbers about the library, then a toolbar to find papers fast.
//   search   words must all appear in the title, authors, abstract or journal
//   sort     newest, oldest or A to Z
//   saved    only the papers you starred (your reading list)
export default function PaperTools({ papers, shown, query, onQuery, sort, onSort, onlySaved, onOnlySaved, savedCount }) {
  const count = (level) => papers.filter((p) => p.difficulty_level === level).length
  const latest = papers.reduce((m, p) => (p.publication_date > m ? p.publication_date : m), '')
  const year = latest ? new Date(latest).getFullYear() : '–'
  const stats = [
    { label: 'Papers', value: papers.length, dot: 'bg-ink' },
    { label: 'Beginner', value: count('beginner'), dot: 'bg-mint' },
    { label: 'Intermediate', value: count('intermediate'), dot: 'bg-sun' },
    { label: 'Advanced', value: count('advanced'), dot: 'bg-coral' },
    { label: 'Newest from', value: year, dot: 'bg-blue' },
  ]
  const active = query.trim() !== '' || onlySaved || sort !== 'newest'

  return (
    <div className="mb-10 grid gap-4 md:mb-12">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="skin-card flex items-center gap-3 px-4 py-3 first:col-span-2 sm:first:col-span-1">
            <span aria-hidden="true" className={`size-3 shrink-0 rounded-full ${s.dot}`} />
            <div>
              <dd className="font-display text-2xl leading-none font-extrabold tracking-tight">{s.value}</dd>
              <dt className="mt-1 t-meta text-sm">{s.label}</dt>
            </div>
          </div>
        ))}
      </dl>

      <div role="search" aria-label="Find a paper" className="skin-card flex flex-wrap items-center gap-3 p-3 md:p-4">
        <label className="skin-input flex min-w-[14rem] flex-1 items-center gap-2 px-4">
          <span aria-hidden="true" className="text-lg">⌕</span>
          <span className="sr-only">Search papers by title, author or topic</span>
          <input
            type="search"
            value={query}
            maxLength={80}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search title, author or topic…"
            autoComplete="off"
            spellCheck="false"
            className="min-h-11 w-full bg-transparent font-medium outline-none placeholder:text-muted"
          />
        </label>
        <label className="flex items-center gap-2 t-meta font-bold text-ink">
          Sort
          <select value={sort} onChange={(e) => onSort(e.target.value)} className="skin-input min-h-11 px-3 font-semibold">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">A to Z</option>
          </select>
        </label>
        <button type="button" aria-pressed={onlySaved} onClick={() => onOnlySaved(!onlySaved)} className="chip">
          <span aria-hidden="true" className="mr-1.5">★</span> Reading list
          <span className="ml-2 rounded-full bg-ink/10 px-2 text-sm tabular-nums">{savedCount}</span>
        </button>
        {active && (
          <button
            type="button"
            onClick={() => {
              onQuery('')
              onSort('newest')
              onOnlySaved(false)
            }}
            className="btn skin-btn skin-btn-soft"
          >
            Clear
          </button>
        )}
        <p role="status" aria-live="polite" className="w-full t-meta font-bold md:ml-1 md:w-auto">
          {active ? `${shown} paper${shown === 1 ? '' : 's'} found` : ''}
        </p>
      </div>
    </div>
  )
}
