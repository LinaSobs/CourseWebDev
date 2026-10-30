import { useState } from 'react'
import { useShop } from '../../context/ShopContext'
import { formatPrice } from '../../lib/format'
import { cover } from '../../lib/asset'
import Stepper from '../../shared/Stepper'
import PurchasedBook from '../../shared/PurchasedBook/PurchasedBook'

export default function BookCard({ book, theme }) {
  const { addToCart, toggleWishlist, isSaved, isPurchased } = useShop()
  const saved = isSaved(book.id)
  // a book this person has bought before: its cover keeps flipping (maths in lib/bookMotion.js)
  const owned = isPurchased(book.id)
  const soldOut = book.stock === 0
  // every card gets its own copy of this state, so changing one card never touches the others
  const [copies, setCopies] = useState(1)
  // true for a moment after adding, so the button can say "Added!" and the book feels like it landed
  const [added, setAdded] = useState(false)

  async function handleAdd() {
    const ok = await addToCart(book, copies)
    if (ok === true) {
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1500)
    }
  }

  return (
    <article
      className={`relative flex min-w-0 shrink-0 basis-[min(80vw,300px)] snap-start flex-col overflow-hidden min-[360px]:basis-[min(76vw,300px)] sm:basis-auto ${theme.card}`}
    >
      {/* heart: save for later (asks you to sign in first if you are not) */}
      <button
        type="button"
        onClick={() => toggleWishlist(book)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${book.title} from wishlist` : `Save ${book.title} to wishlist`}
        className="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-skin-surface/90 text-ink shadow transition active:scale-90"
      >
        <svg viewBox="0 0 24 24" className={`size-6 ${saved ? 'animate-pop motion-reduce:animate-none' : ''}`} fill={saved ? '#ff2e93' : 'none'} stroke={saved ? '#ff2e93' : 'currentColor'} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20.5s-7.5-4.6-9-9.4C2 7.7 4.2 5 7.2 5c1.9 0 3.5 1 4.8 3 1.3-2 2.9-3 4.8-3 3 0 5.2 2.7 4.2 6.1-1.5 4.8-9 9.4-9 9.4z" />
        </svg>
      </button>
      {owned && (
        <span className="badge absolute top-3 left-3 z-10 bg-skin-surface/90 shadow">✓ You own this</span>
      )}
      {owned ? (
        <PurchasedBook book={book} size="fill" loop auto={false} interactive={false} />
      ) : (
        <img
          src={cover(book.id)}
          alt={`Cover of ${book.title}`}
          width="200"
          height="270"
          loading="lazy"
          decoding="async"
          className="h-auto w-full"
        />
      )}
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className={theme.cardTitle}>
          {book.title}
          {book.isNew && (
            <span className={`badge ml-1.5 align-middle ${theme.badge}`}>
              New
            </span>
          )}
        </h3>
        <p className={theme.cardMeta}>
          {book.author} · {book.detail}
        </p>
        <p className={`mt-1 ${theme.cardBlurb}`}>{book.blurb}</p>
        {book.stock > 0 && book.stock <= 5 && <p className="mt-1 text-sm font-bold text-skin-danger">Only {book.stock} left</p>}

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${theme.cardPrice}`}>{formatPrice(book.price)}</span>
            <Stepper value={copies} onChange={setCopies} label={book.title} max={Math.min(10, book.stock || 1)} className={theme.stepper} />
          </div>
          <button
            type="button"
            disabled={soldOut}
            onClick={handleAdd}
            className={`${theme.order} min-h-12 text-lg ${added ? 'animate-pop motion-reduce:animate-none' : ''}`}
          >
            {soldOut ? 'Sold out' : added ? '✓ Added!' : copies > 1 ? `Add ${copies} to cart` : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
