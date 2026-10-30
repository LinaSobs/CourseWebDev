import { useCatalog } from '../../context/CatalogContext'
import { themes } from '../../data/themes'
import Container from '../../shared/Container'

// at the bottom of every shelf page: easy way over to another shelf, or to the other half of the shop
export default function OtherShelves({ current }) {
  const { groups } = useCatalog()
  const here = groups.find((g) => g.id === current)
  const kidsWorld = here?.world === 'kids'
  // same half of the shop first (the Kids Corner has just one shelf, so nothing to list there)
  const siblings = groups.filter((g) => g.world === here?.world && g.id !== current)
  const kids = groups.find((g) => g.world === 'kids')

  return (
    <section className="reveal bg-paper py-12 text-ink md:py-16">
      <Container>
        <h2 className="t-section">
          {kidsWorld ? 'Shopping for someone older?' : 'Shopping for someone else?'}
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {siblings.map((g) => (
            <a
              key={g.id}
              href={`#/${g.id}`}
              className={themes[g.id].pill}
            >
              {g.title}
            </a>
          ))}
          {kidsWorld ? (
            <a href="#/" className="btn skin-btn skin-btn-soft">
              Go to the main shop →
            </a>
          ) : (
            kids && (
              <a href={`#/${kids.id}`} className="btn skin-btn skin-btn-pop">
                🧸 Kids Corner
              </a>
            )
          )}
          {!kidsWorld && (
            <a href="#/" className="btn skin-btn skin-btn-soft">
              All shelves
            </a>
          )}
        </div>
      </Container>
    </section>
  )
}
