// The contact form lives on the home page only. These two helpers let the "Contact" button in the header and the
// links in the footer work from ANY page: on home they just scroll, anywhere else they go home first and then scroll.
let pending = false

export function goToContact(e) {
  if (document.getElementById('contact')) return // the form is on screen (we are on home): the browser scrolls by itself
  e.preventDefault()
  pending = true
  window.location.hash = '#/'
}

// Main calls this after every page change. Returns true if it scrolled to the form (so Main skips scroll-to-top).
export function scrollToContactIfAsked() {
  if (!pending) return false
  pending = false
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  return true
}
