import { useCatalog } from '../../context/CatalogContext'
import Container from '../../shared/Container'
import { goToContact } from '../../lib/contactLink'

const support = [
  { href: '#contact', label: 'Shipping and returns' },
  { href: '#contact', label: 'Track an order' },
  { href: 'mailto:hello@globalbooks.example', label: 'hello@globalbooks.example' },
]

const linkCls = 'inline-flex min-h-9 items-center hover:text-skin-foot-pop'

// smooth scroll back up, same as clicking the logo but from the bottom of the page
function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function Footer() {
  const { groups } = useCatalog()
  return (
    <footer className="bg-skin-foot pb-[calc(5rem_+_env(safe-area-inset-bottom,0px))] text-skin-foot-ink">
      {/* one stripe, one colour per reader group */}
      <div aria-hidden="true" className="mb-16 h-1.5 bg-[linear-gradient(90deg,#8fd0ff,#cfe8ff_50%,#ffb4ae)]" />
      <Container className="mb-7 grid grid-cols-[minmax(0,1fr)] gap-7 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <h3 className="mb-3 font-skin text-3xl font-extrabold text-ink">Global<span className="text-skin-foot-pop">Books</span></h3>
          <p>Your worldwide bookstore. Stories and knowledge across borders.</p>
        </div>
        <div>
          <h3 className="mb-2.5 font-bold text-ink">Shop</h3>
          <ul>
            {groups.filter((g) => g.world === 'general').map((g) => (
              <li key={g.id} className="mb-0.5">
                <a href={`#/${g.id}`} className={linkCls}>{g.title}</a>
              </li>
            ))}
            {groups.filter((g) => g.world === 'kids').map((g) => (
              <li key={g.id} className="mb-0.5">
                <a href={`#/${g.id}`} className={`${linkCls} font-bold text-skin-foot-pop`}>🧸 Kids Corner</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2.5 font-bold text-ink">Support</h3>
          <ul>
            {support.map((s) => (
              <li key={s.label} className="mb-0.5">
                <a href={s.href} onClick={s.href === '#contact' ? goToContact : undefined} className={linkCls}>{s.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <Container as="p" className="border-t border-ink/10 pt-5 text-center text-[0.85rem]">
        &copy; 2026 GlobalBooks. All rights reserved.
      </Container>
      <Container className="mt-4 flex justify-center">
        <button type="button" onClick={backToTop} className={`${linkCls} font-bold underline underline-offset-4`}>
          Back to top ↑
        </button>
      </Container>
    </footer>
  )
}
