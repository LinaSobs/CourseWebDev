import { useCallback, useEffect, useRef } from 'react'
import { cover } from '../../lib/asset'
import { BOOK_MOTION, LOOP_MOTION, LOOP_PAUSE, hueStartFor, sample, totalTime } from '../../lib/bookMotion'

// ONE requestAnimationFrame loop shared by every looping book on the page (it used to be one loop per owned book).
// It only runs while at least one book is on screen, and stops by itself when the last one leaves.
const tickers = new Set()
let frameId = 0
function frame(now) {
  frameId = 0
  tickers.forEach((fn) => fn(now))
  if (tickers.size) frameId = requestAnimationFrame(frame)
}
function addTicker(fn) {
  tickers.add(fn)
  if (!frameId) frameId = requestAnimationFrame(frame)
  return () => {
    tickers.delete(fn)
    if (!tickers.size && frameId) {
      cancelAnimationFrame(frameId)
      frameId = 0
    }
  }
}

// A book you just bought, celebrating: it hops, flips round to show a "Yours!" back, and washes through a colour.
// All the numbers come from lib/bookMotion.js. This file only hands a time to that maths and writes the answer onto the page,
// straight onto the element every frame, so React does not re-render 60 times a second.
//
//   auto      play once when it appears (use `delay` in seconds to stagger a row of books)
//   click     plays it again, so the person can enjoy it twice
//   t         when set to a number, the card freezes at exactly that moment (this is what the Motion Lab scrubber uses)
//   playKey   change this number to start it from outside
//   onFrame   gets the clock time each frame (the Motion Lab draws its cursor with it)
//   loop      repeat the show forever with a rest in between (book lists). Only runs while the card is on screen,
//             each book is shifted in time by its own amount, and it stays still for people who asked for less motion
//   size      'md' | 'sm' | 'fill' (fill = as wide as the box it sits in, no frame of its own, used inside the shop's book cards)
//   interactive false = a plain picture that can't be clicked (the book card around it already has the buttons)
export default function PurchasedBook({ book, size = 'md', delay = 0, auto = true, playKey = 0, t = null, params, loop = false, interactive = true, onFrame, className = '' }) {
  params = params ?? (loop ? LOOP_MOTION : BOOK_MOTION)
  const root = useRef(null)
  const card = useRef(null)
  const raf = useRef(0)
  const live = useRef({ params, onFrame })
  const controlled = t !== null

  useEffect(() => {
    live.current = { params, onFrame }
  })

  // each book picks its own start colour unless the params say otherwise
  const resolve = useCallback((p) => ({ ...p, hueStart: p.hueStart ?? hueStartFor(book.id) }), [book.id])

  const apply = useCallback((s) => {
    const el = root.current
    const c = card.current
    if (!el || !c) return
    el.style.setProperty('--bm-hue', s.hue.toFixed(1))
    el.style.setProperty('--bm-a', s.glow.toFixed(3))
    el.style.setProperty('--bm-shadow', s.shadow.toFixed(3))
    c.style.transform = s.rest ? '' : `translate3d(0, ${(-s.jump).toFixed(2)}px, 0) rotateY(${s.spin.toFixed(2)}deg)`
  }, [])

  const applyRest = useCallback((p) => apply({ hue: p.hueStart, glow: 0, shadow: 1, jump: 0, spin: 0, rest: true }), [apply])

  const play = useCallback(() => {
    cancelAnimationFrame(raf.current)
    let p = resolve(live.current.params)
    // people who asked their device for less motion get a gentle colour glow and nothing that moves or spins
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (calm) p = { ...p, hueTurns: 0 }
    const T = totalTime(p)
    const t0 = performance.now()
    const tick = (now) => {
      const el = (now - t0) / 1000 - delay
      if (el >= T) {
        applyRest(p)
        live.current.onFrame?.(T)
        return
      }
      if (el >= 0) {
        const s = sample(el, p)
        if (calm) Object.assign(s, { jump: 0, spin: 0, shadow: 1 })
        apply(s)
        live.current.onFrame?.(el)
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [apply, applyRest, delay, resolve])

  // frozen at a chosen moment, or back to rest
  useEffect(() => {
    const p = resolve(params)
    if (t === null) applyRest(p)
    else apply(sample(t, p))
  }, [t, params, apply, applyRest, resolve])

  // play on arrival, and again whenever playKey changes
  useEffect(() => {
    if (controlled) return
    if (auto || playKey > 0) play()
    return () => cancelAnimationFrame(raf.current)
  }, [auto, playKey, controlled, play])

  // looping (book lists): follows the real clock, so it keeps its place if the card is re-drawn
  useEffect(() => {
    if (!loop || controlled) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const p = resolve(live.current.params)
    const T = totalTime(p)
    const cycle = T + LOOP_PAUSE
    const phase = (hueStartFor(book.id) / 360) * cycle // each book starts at a different point of its cycle
    let resting = true
    const tick = (now) => {
      const local = (now / 1000 + phase) % cycle
      if (local >= T) {
        // in the pause between two shows nothing changes, so touch nothing (this is most of the time)
        if (!resting) {
          applyRest(p)
          resting = true
        }
        return
      }
      resting = false
      apply(sample(local, p))
    }
    let stop = null
    const watcher = new IntersectionObserver(([entry]) => {
      stop?.()
      stop = null
      if (entry.isIntersecting) stop = addTicker(tick)
      else {
        applyRest(p)
        resting = true
      }
    })
    watcher.observe(root.current)
    return () => {
      watcher.disconnect()
      stop?.()
    }
  }, [loop, controlled, book.id, apply, applyRest, resolve])

  const fill = size === 'fill'
  const Tag = interactive ? 'button' : 'div'
  const buttonProps = interactive
    ? { type: 'button', onClick: () => !controlled && play(), 'aria-label': `${book.title}: you bought this. Play the celebration again.` }
    : {}

  return (
    <Tag
      ref={root}
      {...buttonProps}
      className={`bm ${loop ? 'bm--loop' : ''} ${fill ? 'w-full' : size === 'sm' ? 'w-[76px]' : 'w-[120px]'} ${className}`}
      style={{ '--bm-hue': hueStartFor(book.id) }}
    >
      <span ref={card} className="bm-card block">
        <span className={`bm-face block overflow-hidden ${fill ? '' : 'rounded-lg border-2 border-skin-edge bg-skin-surface'}`}>
          <img src={cover(book.id)} alt={interactive ? '' : `Cover of ${book.title}`} width="200" height="270" loading="lazy" decoding="async" className="h-auto w-full" />
          <span className="bm-tint" />
          {size === 'md' && <span className="block px-1.5 py-1 text-[11px] leading-tight font-bold text-ink">{book.title}</span>}
        </span>
        <span className={`bm-face bm-back text-ink ${fill ? '' : 'rounded-lg border-2 border-skin-edge'}`} aria-hidden="true">
          <span className="grid justify-items-center">
            <span className="text-4xl leading-none font-extrabold">✓</span>
            <span className="text-sm font-extrabold">Yours!</span>
          </span>
        </span>
      </span>
      {!fill && <span className="bm-shadow" aria-hidden="true" />}
    </Tag>
  )
}
