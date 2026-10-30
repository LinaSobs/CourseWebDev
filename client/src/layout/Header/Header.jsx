import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCatalog } from '../../context/CatalogContext'
import { useShop } from '../../context/ShopContext'
import { authClient } from '../../lib/authClient'
import { themes, voices } from '../../data/themes'
import Container from '../../shared/Container'
import Button from '../../shared/Button'
import { goToContact } from '../../lib/contactLink'
import useCategory, { pickCategory } from '../../lib/useCategory'
import SlidingTabs from './SlidingTabs'
import { useHeaderScroll } from '../../lib/useHeaderScroll'
import { useHeaderHeight } from '../../lib/useHeaderHeight'
import useTheme, { toggleTheme } from '../../lib/theme'

export default function Header({ route, skin, world }) {
  const { groups, books } = useCatalog()
  const { user, openAuth, setCartOpen, cartCount, notify } = useShop()
  const [open, setOpen] = useState(false)
  const dark = useTheme() === 'dark'
  const headerRef = useRef(null)

  // Pin: kept = the menu always stays fully visible. Not pinned (the default) = the tab rows tuck away while you scroll down
  // and slide back as you scroll up. The choice is remembered on this device.
  const [pinned, setPinned] = useState(() => {
    try {
      return localStorage.getItem('gb-header-pinned') === '1'
    } catch {
      return false
    }
  })
  const togglePin = () => {
    const next = !pinned
    setPinned(next)
    try {
      localStorage.setItem('gb-header-pinned', next ? '1' : '0')
    } catch {
      // storage can be blocked (private mode); the pin then lasts until the page is closed
    }
  }

  // scroll drives data-tuck on the header DOM node (no re-render)
  useHeaderScroll(headerRef, pinned)
  // measure the header once, write --header-h to <html>
  useHeaderHeight(headerRef)

  // Escape closes the mobile menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const theme = themes[route] ?? themes[skin] ?? themes.home
  const kidsWorld = world === 'kids'

  const ordered = useMemo(() => {
    const kids = []
    const rest = []
    for (const g of groups) (g.world === 'kids' ? kids : rest).push(g)
    return [...kids, ...rest]
  }, [groups])

  const tabs = useMemo(
    () => [
      { id: 'home', label: 'All shelves', icon: '🏠', href: '#/' },
      ...ordered.map((g) => ({
        id: g.id,
        label: g.title,
        icon: (voices[g.id] ?? voices.home).icon,
        href: `#/${g.id}`,
      })),
    ],
    [ordered],
  )

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === route) ?? null,
    [groups, route],
  )
  const activeTab = route === '' ? 'home' : activeGroup?.id ?? null

  // one pass over the books gives the section counts of EVERY shelf (they feed the drop-down menu under each shelf tab)
  const sections = useMemo(() => {
    const perGroup = new Map()
    for (const b of books) {
      let g = perGroup.get(b.group)
      if (!g) perGroup.set(b.group, (g = { total: 0, byCat: new Map() }))
      g.total++
      if (b.category) g.byCat.set(b.category, (g.byCat.get(b.category) ?? 0) + 1)
    }
    const result = new Map()
    for (const group of groups) {
      if (group.id === 'scientists' || !group.categories?.length) continue
      const c = perGroup.get(group.id)
      const list = [{ id: 'all', label: 'Everything', count: c?.total ?? 0 }]
      for (const cat of group.categories) {
        const count = c?.byCat.get(cat.id) ?? 0
        if (count > 0) list.push({ id: cat.id, label: cat.label, icon: cat.icon, count })
      }
      result.set(group.id, list)
    }
    return result
  }, [groups, books])

  // Section menu: the Section bar (Everything, Fiction, Non-fiction...) is gone. Its sections now drop down under the Shelf bar tabs.
  // Point at a tab (mouse), or click / tap the highlighted tab (touch, keyboard) and its sections open under it.
  // They are links, so they also work with a right-click / new tab.
  const flyouts = useMemo(() => {
    const out = {}
    for (const [id, list] of sections) {
      if (list.length > 2) out[id] = list.map((sec) => ({ ...sec, href: sec.id === 'all' ? `#/${id}` : `#/${id}?cat=${sec.id}` }))
    }
    return out
  }, [sections])

  const picked = useCategory()
  // which section of the open shelf is picked right now (it gets the tick in that shelf's drop-down)
  const openSections = activeGroup ? sections.get(activeGroup.id) : null
  const activeSub = openSections?.some((c) => c.id === picked) ? picked : 'all'

  const closeMenu = useCallback(() => setOpen(false), [])
  // a section picked from the drop-down: on the shelf you are already on we just filter and glide down; on another shelf the link opens it
  const handleFlyoutSelect = useCallback(
    (tab, item, event) => {
      setOpen(false)
      if (tab.id === route) {
        event.preventDefault()
        pickCategory(item.id)
      }
    },
    [route],
  )

  return (
    <header
      ref={headerRef}
      data-tuck="none"
      className={`site-header sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-colors ${theme.header}`}
    >
      {/* TOP ROW: everything in ONE row, split into clear sections (logo | account | tools | cart | contact).
          On a phone the account links and the tools fold into the burger menu instead. */}
      <Container className="flex min-h-16 items-center justify-between gap-2.5">
        <a href="#/" className="text-[1.15rem] font-extrabold tracking-[-0.02em] min-[360px]:text-[1.4rem] font-display">
          Global<span className={theme.logoAccent}>Books</span>
          {kidsWorld && (
            <span className="ml-1.5 rounded-full bg-sun px-2 py-0.5 align-middle text-[0.65em] font-extrabold text-ink">
              Kids
            </span>
          )}
        </a>

        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Section 1, ACCOUNT: signed in = one rounded group (avatar + My account | Sign out), signed out = a Sign in button */}
          <nav
            id="nav"
            aria-label="Main"
            className={`${open ? 'flex' : 'hidden'} fixed inset-x-0 top-[calc(64px_+_env(safe-area-inset-top,0px))] max-h-[calc(100dvh_-_64px_-_env(safe-area-inset-top,0px))] flex-col overflow-y-auto border-t border-current/10 px-[var(--gutter)] pt-2 pb-4 md:static md:flex md:max-h-none md:flex-row md:items-center md:gap-0.5 md:overflow-visible md:border-0 md:bg-transparent md:p-0 ${theme.navBg} ${
              user ? 'md:rounded-full md:border md:border-line/80 md:bg-ink/5 md:p-1' : ''
            }`}
          >
            {user ? (
              <>
                <a
                  href="#/account"
                  aria-current={route === 'account' ? 'page' : undefined}
                  onClick={closeMenu}
                  className="flex min-h-11 items-center gap-2.5 text-[1.05rem] font-medium text-ink aria-[current=page]:font-bold md:min-h-9 md:rounded-full md:py-0 md:pr-3.5 md:pl-1 md:text-sm md:font-semibold md:text-ink/80 md:transition-colors md:hover:bg-ink/10 md:hover:text-ink md:aria-[current=page]:bg-skin-accent md:aria-[current=page]:text-white"
                >
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-skin-accent text-xs font-extrabold text-white md:size-7">
                    {(user.name || user.email || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  My account
                </a>
                <span aria-hidden="true" className="mx-0.5 hidden h-5 w-px bg-line md:block" />
                <button
                  type="button"
                  onClick={async () => {
                    setOpen(false)
                    await authClient.signOut()
                    notify('You are signed out.')
                    if (route === 'account') window.location.hash = '#/'
                  }}
                  className="flex min-h-11 items-center gap-2.5 text-[1.05rem] font-medium text-ink md:min-h-9 md:rounded-full md:px-3.5 md:text-sm md:font-semibold md:text-ink/80 md:transition-colors md:hover:bg-ink/10 md:hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  openAuth('signin')
                }}
                className="flex min-h-11 items-center gap-2.5 text-[1.05rem] font-bold text-ink md:rounded-full md:border md:border-line/80 md:bg-ink/5 md:px-4 md:text-sm md:transition-colors md:hover:bg-ink/10"
              >
                <svg viewBox="0 0 24 24" className="size-[1.1rem] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                Sign in
              </button>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={dark}
              className="flex min-h-11 items-center gap-2 text-[1.05rem] font-medium text-ink md:hidden"
            >
              <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
              Night theme{dark ? ' (on)' : ''}
            </button>
            <button
              type="button"
              onClick={togglePin}
              aria-pressed={pinned}
              className="flex min-h-11 items-center gap-2 text-[1.05rem] font-medium text-ink md:hidden"
            >
              <span aria-hidden="true">📌</span>
              Pin menu{pinned ? ' (on)' : ''}
            </button>
            <button
              type="button"
              onClick={closeMenu}
              className={`flex min-h-11 items-center text-[1.05rem] font-medium md:hidden ${theme.closeLink}`}
            >
              Close menu
            </button>
          </nav>

          {/* Section 2, TOOLS: Night theme + Pin, side by side in one rounded group (desktop) */}
          <div role="group" aria-label="Page tools" className="hidden items-center gap-0.5 rounded-full border border-line/80 bg-ink/5 p-1 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={dark}
              aria-label="Night theme"
              title={dark ? 'Night theme is on. Switch to the light theme.' : 'Switch to the Night theme'}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-ink/10"
            >
              {dark ? (
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
                </svg>
              )}
            </button>
            <span aria-hidden="true" className="h-5 w-px bg-line" />
            <button
              type="button"
              onClick={togglePin}
              aria-pressed={pinned}
              aria-label="Pin the menu so it always stays visible"
              title={pinned ? 'Menu pinned. Click to let it hide while you scroll.' : 'Pin the menu so it always stays visible'}
              className={`grid size-9 place-items-center rounded-full transition-colors ${pinned ? 'bg-sun text-ink' : 'hover:bg-ink/10'}`}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z" />
                <path d="M12 14v7" />
              </svg>
            </button>
          </div>

          {/* Section 3, CART */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            className="relative grid size-11 place-items-center rounded-full transition-colors hover:bg-ink/10 md:border md:border-line/80 md:bg-ink/5"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6" />
              <circle cx="9.5" cy="20" r="1.2" />
              <circle cx="17" cy="20" r="1.2" />
            </svg>
            {cartCount > 0 && (
              <span key={cartCount} className="absolute -top-0.5 -right-0.5 grid min-w-5 animate-bump place-items-center rounded-full bg-sun px-1 text-xs font-extrabold text-ink motion-reduce:animate-none">
                {cartCount}
              </span>
            )}
          </button>

          {/* Section 4, CONTACT (the main button) */}
          <Button href="#contact" onClick={goToContact} variant="none" compact className={`rounded-full text-[0.9rem] shadow-sm transition-transform hover:-translate-y-0.5 min-[360px]:text-base ${theme.contactBtn}`}>
            Contact
          </Button>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="nav"
            onClick={() => setOpen(!open)}
            className="grid size-11 place-content-center gap-[5px] md:hidden"
          >
            <span className={`block h-0.5 w-[22px] bg-current transition ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-0.5 w-[22px] bg-current transition ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-[22px] bg-current transition ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </Container>

      {/* Shelf bar: the one row of tabs (All shelves, Kids, Teens...). The highlighted tab opens its sections as a drop-down. */}
      <div className="border-t border-line/70">
        <div className="site-header-row" data-row="tabs">
          <div>
            <Container>
              <SlidingTabs
                label="Shelves"
                items={tabs}
                activeId={activeTab}
                tone="blue"
                onSelect={closeMenu}
                flyouts={flyouts}
                flyoutCurrentId={activeSub}
                onFlyoutSelect={handleFlyoutSelect}
              />
            </Container>
          </div>
        </div>
      </div>
    </header>
  )
}