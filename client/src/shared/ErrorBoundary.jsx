import { Component } from 'react'

// Without this, ONE error while drawing ANY component turns the whole page white and the shop looks "crashed".
// Now only the part that broke is replaced by this message, and the header, cart and the rest keep working.
// Put it around a page with key={route} so switching page gives it a fresh start.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('GlobalBooks: a component crashed', error, info?.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="grid min-h-[50dvh] place-items-center p-6 text-center text-ink">
        <div className="grid gap-4">
          <p className="font-display text-3xl font-extrabold">Something went wrong on this page.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => this.setState({ failed: false })} className="min-h-12 rounded-full bg-sun px-8 text-lg font-bold text-ink">
              Try again
            </button>
            <a href="#/" onClick={() => this.setState({ failed: false })} className="grid min-h-12 place-items-center rounded-full border-2 border-ink px-8 text-lg font-bold">
              Back to the shop
            </a>
          </div>
        </div>
      </div>
    )
  }
}
