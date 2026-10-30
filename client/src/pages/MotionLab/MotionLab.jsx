import { useMemo, useState } from 'react'
import { BOOK_MOTION, checkInvariants, derived, hopStart, jumpHeight, glowAlpha, sample, spinAngle, totalTime } from '../../lib/bookMotion'
import Container from '../../shared/Container'
import MathPlane from '../../shared/MathPlane/MathPlane'
import PurchasedBook from '../../shared/PurchasedBook/PurchasedBook'

// The Motion Lab (#/motion-lab). It exists so the purchased-book animation can be judged by its numbers, not by squinting:
//  - drag the time slider and the book freezes at exactly that moment
//  - three graphs show height, flip angle and colour strength over the whole animation
//  - every rule the maths must obey is checked live, with the expected number next to the real one
//  - the sliders change the constants, and the graphs and rules answer straight away
const sampleBook = { id: 'calculus-tears', title: 'Calculus Tears' }

const controls = [
  { key: 'hopHeight', label: 'Hop height H', unit: 'px', min: 20, max: 120, step: 1, hint: 'How high the first hop goes. Every later hop is lower.' },
  { key: 'hopTime', label: 'First hop time d0', unit: 's', min: 0.3, max: 1, step: 0.01, hint: 'How long the first hop lasts. Longer = floatier.' },
  { key: 'restitution', label: 'Bounce keep e', unit: '', min: 0.2, max: 0.85, step: 0.01, hint: 'Share of speed kept after each landing. Higher = more hops, longer show.' },
  { key: 'omega', label: 'Spring speed w', unit: 'rad/s', min: 6, max: 30, step: 0.5, hint: 'How fast the flip snaps round. Too low and it is still turning when the hops stop.' },
  { key: 'zeta', label: 'Wobble z', unit: '', min: 0.15, max: 1.2, step: 0.01, hint: 'Lower = the flip swings past and comes back. 1 or more = no wobble.' },
  { key: 'turns', label: 'Flip turns', unit: '', min: 1, max: 3, step: 1, hint: 'Whole turns, so the book always ends facing front.' },
  { key: 'glow', label: 'Colour strength', unit: '', min: 0, max: 1, step: 0.01, hint: 'How strong the colour wash is at its peak.' },
]

const fmt = (v, digits = 3) => (Math.abs(v) < 1e-4 && v !== 0 ? v.toExponential(1) : Number(v.toFixed(digits)).toString())

// a small line graph: value against time, with a cursor at the chosen moment
function Plot({ title, unit, fn, T, cursor, color, marks = [], hline }) {
  const W = 340
  const H = 128
  const pl = 40
  const pr = 10
  const pt = 12
  const pb = 22
  const N = 240
  const ys = useMemo(() => Array.from({ length: N + 1 }, (_, i) => fn((T * i) / N)), [fn, T])
  const lo = Math.min(0, ...ys)
  const hi = Math.max(...ys, hline ?? -Infinity)
  const X = (t) => pl + (t / T) * (W - pl - pr)
  const Y = (v) => pt + (1 - (v - lo) / (hi - lo || 1)) * (H - pt - pb)
  const points = ys.map((v, i) => `${X((T * i) / N).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
  const now = fn(cursor)
  return (
    <figure className="skin-card p-3 [box-shadow:none]">
      <figcaption className="mb-1 flex justify-between text-sm font-bold">
        <span>{title}</span>
        <span className="font-mono text-skin-muted">{fmt(now, 2)} {unit}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} over time, ${fmt(now, 2)} ${unit} at ${fmt(cursor)} seconds`} className="w-full">
        <line x1={pl} x2={W - pr} y1={Y(0)} y2={Y(0)} stroke="currentColor" strokeOpacity="0.3" />
        <line x1={pl} x2={pl} y1={pt} y2={H - pb} stroke="currentColor" strokeOpacity="0.3" />
        {hline !== undefined && <line x1={pl} x2={W - pr} y1={Y(hline)} y2={Y(hline)} stroke="currentColor" strokeOpacity="0.45" strokeDasharray="4 4" />}
        {marks.map((m, i) => <line key={i} x1={X(m)} x2={X(m)} y1={Y(0) - 4} y2={Y(0) + 4} stroke="currentColor" strokeOpacity="0.6" />)}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        <line x1={X(cursor)} x2={X(cursor)} y1={pt} y2={H - pb} stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.5" />
        <circle cx={X(cursor)} cy={Y(now)} r="5" fill={color} stroke="white" strokeWidth="2" />
        <text x={pl - 6} y={Y(hi) + 4} textAnchor="end" fontSize="10" fill="currentColor" className="font-mono">{fmt(hi, 0)}</text>
        <text x={pl - 6} y={Y(0) + 4} textAnchor="end" fontSize="10" fill="currentColor" className="font-mono">0</text>
        <text x={W - pr} y={H - 6} textAnchor="end" fontSize="10" fill="currentColor" className="font-mono">t = {fmt(T, 2)} s</text>
        <text x={pl} y={H - 6} fontSize="10" fill="currentColor" className="font-mono">0</text>
      </svg>
    </figure>
  )
}

export default function MotionLab() {
  const [params, setParams] = useState(BOOK_MOTION)
  const [mode, setMode] = useState('idle') // idle | play | scrub
  const [scrubT, setScrubT] = useState(0)
  const [clock, setClock] = useState(0)
  const [playKey, setPlayKey] = useState(0)

  const T = totalTime(params)
  const info = derived(params)
  const rules = useMemo(() => checkInvariants(params), [params])
  const failed = rules.filter((r) => !r.pass)
  const cursor = Math.min(mode === 'scrub' ? scrubT : clock, T)
  const now = sample(cursor, params)
  const hopMarks = useMemo(() => Array.from({ length: 8 }, (_, k) => hopStart(k, params)).filter((t) => t < T), [params, T])
  const groups = [...new Set(rules.map((r) => r.group))]

  const change = (key, value) => {
    setParams((p) => ({ ...p, [key]: value }))
    setMode((m) => (m === 'play' ? 'idle' : m))
  }
  const play = () => {
    setMode('play')
    setClock(0)
    setPlayKey((k) => k + 1)
  }

  return (
    <section className="bg-skin-bg py-10 text-skin-ink md:py-14">
      <Container className="grid gap-8">
        <header className="grid gap-2">
          <h1 className="font-skin text-[clamp(2.2rem,7vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.04em]">Motion lab</h1>
          <p className="max-w-3xl text-lg text-skin-muted">
            One clock, three equations: a bouncing jump, a spring flip and a colour wash. Drag the time slider to freeze the book at an exact moment, change a constant to see what it does,
            and read the rule list at the bottom to see if the maths still holds. The equations are written out at the top of <code className="font-mono text-base">src/lib/bookMotion.js</code>.
          </p>
        </header>

        <MathPlane unit={16} major={4} xLabel="x (px)" yLabel="h (px)" className="skin-card min-h-[420px] [box-shadow:none]">
          <div className="motion-stage relative z-0 flex h-full min-h-[420px] items-end gap-12" style={{ '--hop': `${params.hopHeight}px` }}>
            <PurchasedBook
              book={sampleBook}
              auto={false}
              playKey={playKey}
              t={mode === 'scrub' ? scrubT : null}
              params={params}
              onFrame={mode === 'play' ? setClock : undefined}
            />
            <span className="motion-hop-label absolute right-4 font-mono text-xs font-bold text-skin-muted">
              dashed line: H = {params.hopHeight} px
            </span>
            <span aria-hidden="true" className="motion-hop-line pointer-events-none absolute right-0 left-0 border-t-2 border-dashed border-skin-link/50" />
          </div>
        </MathPlane>

        <div className="skin-card grid gap-3 p-4 [box-shadow:none]">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={play} className="skin-btn min-h-11 px-5 font-bold">▶ Play</button>
            <button type="button" onClick={() => { setMode('idle'); setClock(0) }} className="min-h-11 font-bold underline">Reset</button>
            <label className="flex min-w-[220px] flex-1 items-center gap-3 font-mono text-sm">
              <span className="whitespace-nowrap">t = {fmt(cursor)} s</span>
              <input
                type="range"
                min={0}
                max={T}
                step={0.001}
                value={cursor}
                onChange={(e) => { setMode('scrub'); setScrubT(Number(e.target.value)) }}
                aria-label="Time in seconds"
                className="w-full accent-[var(--skin-link)]"
              />
            </label>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm sm:grid-cols-4">
            <div><dt className="text-skin-muted">hop number k</dt><dd>{now.hop + 1} (s = {fmt(now.s, 2)})</dd></div>
            <div><dt className="text-skin-muted">height h</dt><dd>{fmt(now.jump, 2)} px</dd></div>
            <div><dt className="text-skin-muted">flip angle</dt><dd>{fmt(now.spin, 1)}°</dd></div>
            <div><dt className="text-skin-muted">colour hue</dt><dd>{fmt(now.hue, 0)}° · strength {fmt(now.glow, 2)}</dd></div>
          </dl>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Plot title="Height" unit="px" fn={(t) => jumpHeight(t, params)} T={T} cursor={cursor} color="#3d5afe" marks={hopMarks} hline={params.hopHeight} />
          <Plot title="Flip angle" unit="°" fn={(t) => spinAngle(t, params)} T={T} cursor={cursor} color="#ff6b57" hline={360 * Math.round(params.turns)} />
          <Plot title="Colour strength" unit="" fn={(t) => glowAlpha(t / T, params)} T={T} cursor={cursor} color="#c026d3" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="skin-card grid content-start gap-4 p-4 [box-shadow:none]">
            <h2 className="font-skin text-2xl font-extrabold">Constants</h2>
            {controls.map((c) => (
              <label key={c.key} className="grid gap-1">
                <span className="flex justify-between text-sm font-bold">
                  <span>{c.label}</span>
                  <span className="font-mono">{fmt(params[c.key], 2)} {c.unit}</span>
                </span>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={params[c.key]}
                  onChange={(e) => change(c.key, Number(e.target.value))}
                  className="w-full accent-[var(--skin-link)]"
                />
                <span className="text-sm text-skin-muted">{c.hint}</span>
              </label>
            ))}
            <button type="button" onClick={() => setParams(BOOK_MOTION)} className="min-h-11 self-start font-bold underline">Back to the saved constants</button>
            <h3 className="mt-2 font-skin text-lg font-extrabold">What these constants give you</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm">
              <dt className="text-skin-muted">Whole show T</dt><dd>{fmt(info.total)} s</dd>
              <dt className="text-skin-muted">Gravity g</dt><dd>{fmt(info.gravity, 0)} px/s²</dd>
              <dt className="text-skin-muted">Hops you can see</dt><dd>{info.hops}</dd>
              <dt className="text-skin-muted">Flip goes past by</dt><dd>{fmt(info.overshoot * 100, 1)} % ({fmt(info.peakAngle, 0)}° at the peak)</dd>
              <dt className="text-skin-muted">Flip settled by</dt><dd>{fmt(info.settle)} s</dd>
            </dl>
          </div>

          <div className="skin-card grid content-start gap-4 p-4 [box-shadow:none]">
            <div>
              <h2 className="font-skin text-2xl font-extrabold">Rules the maths must obey</h2>
              <p role="status" className={`font-bold ${failed.length ? 'text-skin-danger' : 'text-skin-link'}`}>
                {failed.length === 0 ? `All ${rules.length} rules hold.` : `${rules.length - failed.length} of ${rules.length} rules hold. ${failed.length} need a look.`}
              </p>
            </div>
            {groups.map((g) => (
              <div key={g}>
                <h3 className="mb-1 text-sm font-extrabold tracking-wide uppercase text-skin-muted">{g}</h3>
                <ul className="divide-y divide-skin-line">
                  {rules.filter((r) => r.group === g).map((r) => (
                    <li key={r.id} className="grid grid-cols-[1.5rem_1fr] gap-x-2 py-1.5 text-sm">
                      <span aria-label={r.pass ? 'holds' : 'fails'} className={`font-extrabold ${r.pass ? 'text-skin-link' : 'text-skin-danger'}`}>{r.pass ? '✓' : r.kind === 'design' ? '!' : '✗'}</span>
                      <span>
                        {r.rule}
                        <span className="block font-mono text-xs text-skin-muted">expected {fmt(r.expected, 4)} · measured {fmt(r.actual, 4)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
