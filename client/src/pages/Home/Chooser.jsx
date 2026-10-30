import { useCatalog } from '../../context/CatalogContext'
import { themes } from '../../data/themes'
import { cover } from '../../lib/asset'
import Container from '../../shared/Container'

export default function Chooser() {
  const { groups, books } = useCatalog()
  // the Kids Corner has its own banner right below, so the tiles here are teens to scientists
  const general = groups.filter((g) => g.world === 'general')
  return (
    <section id="choose" className="bg-paper [background-image:radial-gradient(rgba(15,109,187,0.10)_2px,transparent_2px)] [background-size:30px_30px] py-16 md:py-28">
      <Container>
        <div className="reveal mb-10 md:mb-14">
          <h2 className="t-section">Find your shelf</h2>
          <p className="t-lede mt-4">
            From teens to scientists, pick your level and everything is sorted for you. Shopping for a child? The Kids Corner is just below.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {general.map((g) => {
            const t = themes[g.id]
            // every tile shows two real covers from its own shelf (same look on every tile)
            const picks = books.filter((b) => b.group === g.id).slice(0, 2)
            return (
              <a
                key={g.id}
                href={`#/${g.id}`}
                className={`group relative isolate flex min-h-[300px] flex-col justify-between gap-6 overflow-hidden p-6 transition-transform duration-[calc(200ms*var(--dur-scale))] hover:-translate-y-2 md:min-h-[340px] md:p-8 ${t.heroBg} ${t.heroPattern} ${t.tileShape} ${t.font}`}
              >
                <div aria-hidden="true" className="flex justify-end -space-x-6 transition-transform duration-[calc(200ms*var(--dur-scale))] group-hover:rotate-3 group-hover:scale-105">
                  {picks.map((b, i) => (
                    <img
                      key={b.id}
                      src={cover(b.id)}
                      alt=""
                      width="200"
                      height="270"
                      loading="lazy"
                      decoding="async"
                      className={`h-auto w-20 rounded-lg shadow-[0_10px_24px_rgba(18,38,63,0.25)] md:w-24 ${i === 0 ? '-rotate-6' : 'rotate-6 translate-y-2'}`}
                    />
                  ))}
                </div>
                <div>
                  <h3 className="t-title text-4xl">{g.title}</h3>
                  <p className={`mt-2 max-w-[24ch] ${t.tileLine}`}>{g.homeLine}</p>
                </div>
                <span className={`text-lg font-bold underline decoration-2 underline-offset-4 ${t.tileCta}`}>
                  Enter the {g.title.toLowerCase()} shelf →
                </span>
              </a>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
