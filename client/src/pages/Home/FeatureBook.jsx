import { useCatalog } from '../../context/CatalogContext'
import { useShop } from '../../context/ShopContext'
import { formatPrice } from '../../lib/format'
import { cover } from '../../lib/asset'
import Button from '../../shared/Button'

export default function FeatureBook() {
  const { books } = useCatalog()
  const { addToCart } = useShop()
  // book of the month: the one book the database marks as featured
  const book = books.find((b) => b.isFeatured)
  if (!book) return null
  return (
    <section aria-label="Book of the month" className="bg-paper py-16 md:py-28">
      <div className="reveal mx-auto grid w-[min(1180px,calc(100%_-_2*var(--gutter)))] grid-cols-[minmax(0,1fr)] items-center gap-8 rounded-[36px] bg-[#ffe3e0] p-7 text-ink dark:bg-[#33222a] md:grid-cols-[260px_1fr] md:gap-10 md:p-12 lg:grid-cols-[300px_1fr]">
        <img
          src={cover(book.id)}
          alt={`Cover of ${book.title}`}
          width="200"
          height="270"
          loading="lazy"
          decoding="async"
          className="mx-auto h-auto w-[min(240px,70%)] md:w-full animate-sway rounded-lg shadow-[0_18px_36px_rgba(18,38,63,0.25)] motion-reduce:animate-none"
        />
        <div>
          <span className="mb-4 inline-block rounded-full bg-ink px-4 py-1 text-base font-bold text-paper">
            Book of the month
          </span>
          <h2 className="t-section">{book.title}</h2>
          <p className="t-lede mt-4 mb-6">
            {book.author}. {book.blurb}
          </p>
          <span className="mr-4 font-display text-4xl font-extrabold tracking-tight text-blue">{formatPrice(book.price)}</span>
          <Button as="button" type="button" variant="skin" large disabled={book.stock === 0} onClick={() => addToCart(book)}>
            {book.stock === 0 ? 'Sold out' : 'Add to cart'}
          </Button>
        </div>
      </div>
    </section>
  )
}
