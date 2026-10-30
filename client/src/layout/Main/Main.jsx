import { useEffect, useRef } from 'react'
import { useCatalog } from '../../context/CatalogContext'
import Home from '../../pages/Home/Home'
import AccountPage from '../../pages/Account/AccountPage'
import AudiencePage from '../../pages/Shelf/AudiencePage'
import MotionLab from '../../pages/MotionLab/MotionLab'
import CheckoutResult from '../../pages/Checkout/CheckoutResult'
import ResearchPage from '../../pages/Research/ResearchPage'
import { scrollToContactIfAsked } from '../../lib/contactLink'
import ErrorBoundary from '../../shared/ErrorBoundary'

// The router outlet: shows the home page, or the page for whichever group is in the address.
export default function Main({ route }) {
  const { groups } = useCatalog()
  const group = groups.find((g) => g.id === route) // undefined means home
  const isAccount = route === 'account'
  const isLab = route === 'motion-lab'
  const isCheckout = route === 'checkout/success' || route === 'checkout/cancelled' // where Stripe sends people back to
  const isResearch = group?.id === 'scientists' // the scientists shelf became the Research & Book news portal

  // when the page changes: back to the top, and a title that matches
  const first = useRef(true)
  useEffect(() => {
    document.title = isCheckout ? 'Your payment | GlobalBooks' : isResearch ? 'Research & Book | GlobalBooks' : isLab ? 'Motion lab | GlobalBooks' : isAccount ? 'My account | GlobalBooks' : group ? `${group.title} | GlobalBooks` : 'GlobalBooks | Books for every reader'
    if (first.current) {
      first.current = false // don't jump on first load, someone might have opened #contact
      return
    }
    // arriving from the Contact button on another page: glide to the form instead of the top
    if (scrollToContactIfAsked()) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [group, isAccount, isLab, isResearch, isCheckout])

  return (
    <main id="main">
      {/* key makes React start a fresh page (and a fresh filter) when you switch groups; the boundary keeps one broken page from taking the header down with it */}
      <ErrorBoundary key={route}>
        {isCheckout ? <CheckoutResult cancelled={route === 'checkout/cancelled'} /> : isLab ? <MotionLab /> : isResearch ? <ResearchPage /> : isAccount ? <AccountPage /> : group ? <AudiencePage key={group.id} group={group} /> : <Home />}
      </ErrorBoundary>
    </main>
  )
}
