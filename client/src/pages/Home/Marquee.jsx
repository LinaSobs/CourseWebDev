import { useCatalog } from '../../context/CatalogContext'
import { cover } from '../../lib/asset'

export default function Marquee() {
  const { books } = useCatalog()
  // the list is doubled so the loop (it slides left by exactly half) has no visible jump
  // only a handful of covers: the strip used to hold every book twice (100+ images in one huge animated layer, which phones run out of memory on)
  const shown = books.slice(0, 14)
  const loop = [...shown, ...shown]
  return (
    <div
      aria-hidden="true"
      className="group overflow-hidden bg-ink-soft py-8 [-webkit-mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] motion-reduce:overflow-x-auto"
    >
      <div className="flex w-max animate-marquee-slow group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {loop.map((book, i) => (
          <img
            key={i}
            src={cover(book.id)}
            alt=""
            width="200"
            height="270"
            loading="lazy"
            decoding="async"
            className="mr-6 h-auto w-[clamp(130px,32vw,230px)] shrink-0 rounded-xl shadow-[0_14px_30px_rgba(18,38,63,0.25)]"
          />
        ))}
      </div>
    </div>
  )
}
