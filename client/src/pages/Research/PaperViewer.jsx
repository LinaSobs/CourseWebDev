import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import { SaveStar } from './cards'
import { LevelBadge, PdfIcon, citeApa, citeBibtex, formatDate, safeHttpUrl, useCopy } from './bits'

// The PDF viewer. A fixed-size window (the whole screen on a phone, a big centred window on a computer):
//   header    what you are reading + Close
//   toolbar   Previous / Next paper (through the list you came from), Save, Cite, BibTeX
//   middle    the PDF itself, in the browser's own PDF viewer (zoom, page jump, search, print are all built in)
//   footer    Open in a new tab / Download / DOI, so there is always a way out if a site does not allow its PDF in a frame
// The Modal around it handles Escape, the focus trap and giving focus back to the card.
//
// Not every browser can show a PDF inside a page (most phone browsers cannot), and some publishers forbid being framed.
// So the footer is always there, and a browser that cannot show PDFs gets a big "Open PDF" button instead of an empty frame.
const GIVE_UP_MS = 4000 // show the frame even if the browser never says it finished loading

export default function PaperViewer({ paper: first, list = [], saved, onToggleSave, onClose }) {
  const [id, setId] = useState(first.id)
  const at = Math.max(0, list.findIndex((p) => p.id === id))
  const paper = list[at] ?? first
  const closeBtn = useRef(null)
  const go = (step) => list[at + step] && setId(list[at + step].id)

  return (
    <Modal label={`PDF: ${paper.title}`} onClose={onClose} initialFocus={closeBtn} className="flex h-dvh flex-col md:h-[calc(100dvh-4rem)] md:max-w-6xl">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-skin-surface px-4 py-3 md:px-6">
        <PdfIcon className="hidden size-12 sm:grid" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 t-meta">
            <LevelBadge level={paper.difficulty_level} />
            <time dateTime={paper.publication_date}>{formatDate(paper.publication_date)}</time>
            {paper.journal_or_source && <span>· {paper.journal_or_source}</span>}
          </p>
          <h2 className="t-card-title line-clamp-2 text-[1.05rem] md:text-xl">{paper.title}</h2>
          <p className="truncate t-meta">{paper.authors.join(', ')}</p>
        </div>
        <button ref={closeBtn} type="button" onClick={onClose} className="btn skin-btn skin-btn-soft shrink-0">
          <span aria-hidden="true">✕</span> Close
        </button>
      </div>
      <ViewerBody key={paper.id} paper={paper} list={list} at={at} go={go} saved={saved} onToggleSave={onToggleSave} />
    </Modal>
  )
}

// everything under the header. It is keyed by the paper, so moving to the next paper starts a clean frame and loading state.
function ViewerBody({ paper, list, at, go, saved, onToggleSave }) {
  const url = safeHttpUrl(paper.pdf_url)
  const doi = paper.doi ? `https://doi.org/${paper.doi}` : null
  const [ready, setReady] = useState(false)
  const [done, copy] = useCopy()
  const canEmbed = Boolean(url) && (typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false)
  // open page-width, no side panel (the browser reads these hints from the #fragment)
  const src = url && !url.includes('#') ? `${url}#view=FitH&navpanes=0` : url

  useEffect(() => {
    if (!canEmbed || ready) return
    const t = window.setTimeout(() => setReady(true), GIVE_UP_MS)
    return () => window.clearTimeout(t)
  }, [canEmbed, ready])

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-ink-soft/50 px-4 py-2 md:px-6">
        {list.length > 1 && (
          <div className="flex items-center gap-1.5" role="group" aria-label="Move between papers">
            <button type="button" onClick={() => go(-1)} disabled={at === 0} className="btn skin-btn skin-btn-soft min-h-10 px-3">
              <span aria-hidden="true">‹</span> Prev<span className="sr-only">ious paper</span>
            </button>
            <p className="px-1 t-meta font-bold tabular-nums">
              {at + 1} / {list.length}
            </p>
            <button type="button" onClick={() => go(1)} disabled={at === list.length - 1} className="btn skin-btn skin-btn-soft min-h-10 px-3">
              Next<span className="sr-only"> paper</span> <span aria-hidden="true">›</span>
            </button>
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => copy(citeApa(paper), 'Citation')} className="btn skin-btn skin-btn-soft min-h-10 px-3.5">
            {done === 'Citation' ? 'Copied ✓' : 'Cite'}
          </button>
          <button type="button" onClick={() => copy(citeBibtex(paper), 'BibTeX')} className="btn skin-btn skin-btn-soft min-h-10 px-3.5">
            {done === 'BibTeX' ? 'Copied ✓' : 'BibTeX'}
          </button>
          {onToggleSave && <SaveStar saved={saved.has(paper.id)} title={paper.title} onClick={() => onToggleSave(paper.id)} className="size-10" />}
        </div>
        <p role="status" className="sr-only">{done && `${done} copied to the clipboard.`}</p>
      </div>

      <div className="relative min-h-0 flex-1 bg-ink-soft">
        {canEmbed ? (
          <>
            {!ready && (
              <div role="status" className="absolute inset-0 grid place-content-center justify-items-center gap-3 t-meta font-bold">
                <PdfIcon className="size-16 motion-safe:animate-pulse" />
                Loading the PDF…
              </div>
            )}
            <iframe
              title={`PDF of ${paper.title}`}
              src={src}
              tabIndex={0}
              referrerPolicy="no-referrer"
              onLoad={() => setReady(true)}
              className={`absolute inset-0 size-full border-0 bg-white transition-opacity duration-[calc(300ms*var(--dur-scale))] ${ready ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-4 p-8 text-center">
            <PdfIcon className="size-20" />
            <p className="t-title">{url ? 'Your browser can’t show PDFs on this page' : 'This paper has no PDF yet'}</p>
            {url && (
              <>
                <p className="t-body max-w-[40ch]">Open it in its own tab instead. It is the same file.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-lg skin-btn">
                  Open the PDF <span aria-hidden="true">↗</span>
                </a>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line bg-skin-surface px-4 py-3 md:px-6">
        <p className="t-meta">{canEmbed ? 'Can’t see the PDF? Open it in a new tab.' : 'Opens in a new tab.'}</p>
        {url && (
          <div className="flex flex-wrap gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn skin-btn">
              Open in new tab<span aria-hidden="true"> ↗</span>
            </a>
            <a href={url} download target="_blank" rel="noopener noreferrer" className="btn skin-btn skin-btn-soft">
              Download
            </a>
            {doi && (
              <a href={doi} target="_blank" rel="noopener noreferrer" className="btn skin-btn skin-btn-soft">
                DOI<span aria-hidden="true"> ↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </div>
    </>
  )
}
