import { useCatalog } from '../../context/CatalogContext'
import Container from '../../shared/Container'

// Each section gets its own bright colour. They repeat if there are more sections than colours.
const colours = [
  'bg-sun text-ink',
  'bg-coral text-ink',
  'bg-mint text-ink',
  'bg-[#bfe0fb] text-ink dark:bg-[#1b3a5c]',
  'bg-[#ffd9d5] text-ink dark:bg-[#4a2a30]',
  'bg-[#d6f5ea] text-ink dark:bg-[#1c4437]',
]

// The Kids Corner's own menu: one big tile per kind of book. Clicking one filters the shelf below.
export default function KidsCategories({ group, onPick }) {
  const { books } = useCatalog()
  return (
    <section aria-label="What are you looking for?" className="bg-skin-surface py-12 text-ink md:py-20">
      <Container>
        <div className="reveal mb-8">
          <h2 className="t-section">What do you feel like?</h2>
          <p className="t-lede mt-3">Pick a corner. Everything for little readers is in here.</p>
        </div>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {group.categories.map((c, i) => {
            const count = books.filter((b) => b.group === group.id && b.category === c.id).length
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onPick(c.id)}
                  className={`flex min-h-36 w-full flex-col items-start justify-between gap-3 rounded-3xl border border-line p-4 text-left shadow-[0_10px_30px_rgba(18,38,63,0.08)] transition hover:-translate-y-1 active:translate-y-0 md:min-h-44 md:p-6 ${colours[i % colours.length]}`}
                >
                  <span aria-hidden="true" className="text-5xl md:text-6xl">{c.icon}</span>
                  <span>
                    <span className="t-card-title block">{c.label}</span>
                    <span className="block text-base font-medium text-ink/80">{count} {count === 1 ? 'book' : 'books'}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
