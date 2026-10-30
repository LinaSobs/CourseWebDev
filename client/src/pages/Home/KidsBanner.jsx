import { useCatalog } from '../../context/CatalogContext'
import { cover } from '../../lib/asset'
import Container from '../../shared/Container'

// On the main shop's home page: the doorway to the Kids Corner, so parents can find it straight away.
export default function KidsBanner() {
  const { books, groups } = useCatalog()
  const kids = groups.find((g) => g.world === 'kids')
  if (!kids) return null
  const picks = books.filter((b) => b.group === kids.id).slice(0, 3)

  return (
    <section aria-label="Kids Corner" className="bg-paper pb-16 md:pb-28">
      <Container>
        <a
          href={`#/${kids.id}`}
          className="skin-card card-lift group relative isolate flex flex-col gap-8 overflow-hidden bg-linear-to-br from-[#d6ecff] to-[#ffe3e0] p-6 text-ink dark:from-[#14283f] dark:to-[#33222a] md:flex-row md:items-center md:justify-between md:p-12"
        >
          <div className="max-w-[34ch]">
            <p className="t-eyebrow mb-4">🧸 New: the Kids Corner</p>
            <h2 className="t-section">A whole shop just for kids</h2>
            <p className="t-lede mt-3">Picture books, bedtime stories, learning, adventures and colouring. Ages 3 to 10.</p>
            <span className="btn btn-lg skin-btn skin-btn-pop mt-6">
              Enter the Kids Corner →
            </span>
          </div>
          <div aria-hidden="true" className="flex justify-center -space-x-6 md:justify-end">
            {picks.map((b, i) => (
              <img
                key={b.id}
                src={cover(b.id)}
                alt=""
                width="200"
                height="270"
                loading="lazy"
                className="kids-pick h-auto w-28 rounded-2xl border-4 border-white shadow-[0_14px_30px_rgba(18,38,63,0.20)] transition-transform duration-[calc(200ms*var(--dur-scale))] group-hover:-translate-y-2 sm:w-36 md:w-40"
                style={{ '--rot': `${(i - 1) * 7}deg` }}
              />
            ))}
          </div>
        </a>
      </Container>
    </section>
  )
}
