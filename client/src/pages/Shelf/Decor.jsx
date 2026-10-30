// Soft background decoration for the shelf sections. Inline SVG, no image files, so it can't go missing.
// It used to be five different drawing styles (toys, neon, notebooks, lab glass...) in colours that were not part of the
// site palette. Now every shelf gets the SAME small set of shapes in the site's own colours (blue, coral, mint),
// and they animate the same way: a slow float and a gentle twinkle.
// Decoration only: aria-hidden, no clicks, always behind the cards.

const BLUE = '#7cc4ff'
const CORAL = '#ffb4ae'
const MINT = '#bdeedb'

function Star({ className, fill, delay = '0s' }) {
  return (
    <svg viewBox="0 0 20 20" className={`sparkle animate-twinkle motion-reduce:animate-none ${className}`} style={{ '--delay': delay }}>
      <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill={fill} />
    </svg>
  )
}

function Blob({ className, fill }) {
  return <span className={`block rounded-full ${className}`} style={{ background: fill }} />
}

export default function Decor() {
  const bob = 'animate-bob motion-reduce:animate-none'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <Blob fill={BLUE} className={`absolute -top-10 -right-10 size-40 opacity-30 md:size-64 ${bob}`} />
      <Blob fill={CORAL} className={`absolute top-[45%] -left-12 size-32 opacity-30 md:size-52 ${bob} [animation-delay:-2s]`} />
      <Blob fill={MINT} className={`absolute -right-8 bottom-10 size-28 opacity-50 md:size-44 ${bob} [animation-delay:-1s]`} />

      <Star fill={BLUE} className="absolute top-[8%] left-[6%] w-6 md:w-8" />
      <Star fill={CORAL} className="absolute top-[20%] right-[12%] w-5 md:w-7" delay="-0.8s" />
      <Star fill={BLUE} className="absolute bottom-[14%] left-[14%] hidden w-6 md:block" delay="-1.6s" />
      <Star fill={CORAL} className="absolute right-[30%] bottom-[6%] hidden w-5 md:block" delay="-2.2s" />
    </div>
  )
}
