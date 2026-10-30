import { useEffect } from 'react'
import useRoute from './lib/useRoute'
import { useCatalog } from './context/CatalogContext'
import Header from './layout/Header/Header'
import Main from './layout/Main/Main'
import Footer from './layout/Footer/Footer'
import ChatFab from './layout/ChatFab/ChatFab'
import AuthDialog from './layout/AuthDialog/AuthDialog'
import CartDrawer from './layout/CartDrawer/CartDrawer'
import Toast from './layout/Toast/Toast'
import { SkinProvider } from './context/SkinContext'

export default function App() {
  // which page are we on? (the part after #/ in the address)
  const route = useRoute()
  const { status, reload, groups } = useCatalog()

  // The shop has two halves: the Kids Corner and the main shop (teens to scientists).
  // Cart, sign in, account, contact and footer wear the colours of the half you are in, and stay calm and the same
  // across all the main-shop shelves. On pages with no shelf (My account) we use the half you were last in.
  const shelfWorld = groups.find((g) => g.id === route)?.world
  useEffect(() => {
    if (shelfWorld) {
      try {
        localStorage.setItem('gb-world', shelfWorld)
      } catch {
        // storage can be blocked (private mode), then we just fall back to the main shop
      }
    }
  }, [shelfWorld])
  let world = shelfWorld ?? 'general'
  if (!shelfWorld && route === 'account') {
    try {
      world = localStorage.getItem('gb-world') === 'kids' ? 'kids' : 'general'
    } catch {
      // same as above
    }
  }
  const skin = world === 'kids' ? 'kids' : 'home'

  // The whole site is built from the catalog, so wait for it. (The free database sleeps when idle; the first call can take a few seconds.)
  if (status !== 'ready') {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper p-6 text-center text-ink">
        {status === 'error' ? (
          <div className="grid gap-4">
            <p className="font-display text-3xl font-extrabold">We couldn’t reach the shop.</p>
            <button type="button" onClick={reload} className="mx-auto min-h-12 rounded-full bg-sun px-8 text-lg font-bold text-ink">
              Try again
            </button>
          </div>
        ) : (
          <div className="grid justify-items-center gap-6">
            {/* three little books hopping while the free database wakes up */}
            <div aria-hidden="true" className="flex items-end gap-2">
              <span className="h-14 w-8 animate-hop rounded-sm bg-coral motion-reduce:animate-none" />
              <span className="h-20 w-8 animate-hop rounded-sm bg-sun [animation-delay:0.15s] motion-reduce:animate-none" />
              <span className="h-16 w-8 animate-hop rounded-sm bg-mint [animation-delay:0.3s] motion-reduce:animate-none" />
            </div>
            <p role="status" className="font-display text-3xl font-extrabold">Opening the shop…</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <SkinProvider value={skin}>
      <div data-skin={skin}>
        <a
          href="#main"
          className="absolute -left-[999px] top-0 z-[200] bg-sun px-4 py-2.5 text-ink focus:left-0"
        >
          Skip to content
        </a>
        <Header route={route} skin={skin} world={world} />
        <Main route={route} />
        <Footer />
        <ChatFab />
        <AuthDialog />
        <CartDrawer />
        <Toast />
      </div>
    </SkinProvider>
  )
}
