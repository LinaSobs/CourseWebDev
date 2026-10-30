import { useEffect, useRef, useState } from 'react'
import { asset } from '../../lib/asset'
import { formatPrice, formatDate } from '../../lib/format'

// ---- difficulty badge: the site's own mint / light blue / coral with dark text (all pass WCAG AA contrast)
const BADGE = {
  beginner: 'bg-mint',
  intermediate: 'bg-sun',
  advanced: 'bg-coral',
}
export function LevelBadge({ level, className = '' }) {
  if (!level) return null
  return <span className={`badge capitalize ${BADGE[level]} ${className}`}>{level}</span>
}

// ---- responsive picture: AVIF first, WebP next, the browser picks the best it supports and the smallest width that fits
const withBase = (set) => set.split(', ').map((part) => asset(part)).join(', ')
export function NewsImage({ image, alt, sizes, eager = false, className = '' }) {
  // imported stories come with the publisher's own picture (one size, no AVIF/WebP set)
  if (image.remote) {
    return <img src={image.src} alt={alt} width="800" height="450" loading={eager ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" className={`aspect-video w-full object-cover ${className}`} />
  }
  return (
    <picture>
      <source type="image/avif" srcSet={withBase(image.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={withBase(image.webp)} sizes={sizes} />
      <img
        src={asset(image.src)}
        alt={alt}
        width="800"
        height="450"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        className={`aspect-video w-full object-cover ${className}`}
      />
    </picture>
  )
}

// ---- wraps the words you searched for in <mark>. Plain strings only (no dangerouslySetInnerHTML), so it is injection-safe.
export function Highlight({ text, query }) {
  const words = (query.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!words.length) return text
  const re = new RegExp(`(${words.join('|')})`, 'giu')
  return text.split(re).map((part, i) =>
    i % 2 ? (
      <mark key={i} className="rounded bg-coral/60 px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export { formatDate, formatPrice as money }

// ---- only http(s) links may be put into a frame or a link (a javascript: address must never get through)
export function safeHttpUrl(value) {
  if (!value) return null
  try {
    const u = new URL(value, window.location.href)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

// ~200 words a minute
export const readingMinutes = (text = '') => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200))

// ---- round badge with the first letter of a name
export function Initial({ name = '', className = '' }) {
  return (
    <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full bg-skin-accent text-sm font-extrabold text-white ${className}`}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

// ---- the little document tile that stands for a PDF
export function PdfIcon({ className = 'size-14' }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-content-center justify-items-center rounded-2xl bg-coral/40 text-ink ${className}`}>
      <svg viewBox="0 0 24 24" className="size-[46%]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
        <path d="M14 2v5h5" />
        <path d="M8 13h8M8 17h5" />
      </svg>
      <span className="text-[0.6rem] font-extrabold leading-none tracking-wider">PDF</span>
    </span>
  )
}

export function stockInfo(qty) {
  if (qty <= 0) return { label: 'Sold out', cls: 'bg-ink text-paper' }
  if (qty <= 5) return { label: `Only ${qty} left`, cls: 'bg-coral text-ink' }
  return { label: 'In stock', cls: 'bg-mint text-ink' }
}

// ---- citations: copy-ready text for a paper
const yearOf = (p) => (p.publication_date || '').slice(0, 4) || 'n.d.'
export function citeApa(p) {
  const a = p.authors
  const names = a.length <= 2 ? a.join(' & ') : `${a.slice(0, -1).join(', ')}, & ${a[a.length - 1]}`
  return `${names} (${yearOf(p)}). ${p.title}.${p.journal_or_source ? ` ${p.journal_or_source}.` : ''}${p.doi ? ` https://doi.org/${p.doi}` : ''}`
}
export function citeBibtex(p) {
  const clean = (t = '') => String(t).replace(/[{}]/g, '')
  const key = `${(p.authors[0] || 'paper').split(/\s+/).pop().replace(/[^A-Za-z]/g, '').toLowerCase() || 'paper'}${yearOf(p)}`
  const rows = [
    ['title', `{${clean(p.title)}}`],
    ['author', clean(p.authors.join(' and '))],
    p.journal_or_source && ['journal', clean(p.journal_or_source)],
    ['year', yearOf(p)],
    p.doi && ['doi', clean(p.doi)],
  ].filter(Boolean)
  return `@article{${key},\n${rows.map(([k, v]) => `  ${k} = {${v}}`).join(',\n')}\n}`
}

// ---- copy to the clipboard and say so for two seconds: const [done, copy] = useCopy();  copy(text, 'Citation')
export function useCopy() {
  const [done, setDone] = useState('')
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // older browsers / blocked clipboard: the classic way
      const box = document.createElement('textarea')
      box.value = text
      box.setAttribute('readonly', '')
      box.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(box)
      box.select()
      try {
        document.execCommand('copy')
      } catch {
        // nothing more we can do
      }
      box.remove()
    }
    setDone(label)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(''), 2000)
  }
  return [done, copy]
}
