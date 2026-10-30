import { useCatalog } from '../../context/CatalogContext'
import { themes } from '../../data/themes'
import { cover } from '../../lib/asset'
import PageHero, { fanOf } from '../../shared/PageHero/PageHero'
import Button from '../../shared/Button'

// the five books in the fan on the home page
const fanIds = ['glass-orbit', 'moon-bakery', 'cartographer', 'learning-machines', 'global-novel']

export default function Hero() {
  const { groups } = useCatalog()
  return (
    <PageHero
      id="top"
      title={<>Books for <span className="text-blue">every reader,</span> delivered anywhere.</>}
      intro="Picture books to textbooks. Shipped to over 180 countries."
      covers={fanOf(fanIds.map(cover), 80)}
      extra={
        // sticker
        <div className="absolute top-0 right-0 z-10 grid size-24 rotate-12 place-content-center rounded-full bg-coral text-center font-display leading-none font-extrabold text-ink md:size-32 lg:right-2">
          <span className="text-3xl md:text-4xl">180+</span>
          <span className="text-sm md:text-base">countries</span>
        </div>
      }
      actions={
        <>
          <Button large variant="skin" href="#choose">
            Choose your shelf
          </Button>
          <div className="mt-8 flex flex-wrap gap-3">
            {groups.map((g) => (
              <a key={g.id} href={`#/${g.id}`} className={themes[g.id].pill}>
                {g.title}
              </a>
            ))}
          </div>
        </>
      }
    />
  )
}
