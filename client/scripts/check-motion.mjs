// Runs every rule from bookMotion.js against several sets of numbers and prints what held and what did not.
// Use it with:  npm run check:motion
import { BOOK_MOTION, LOOP_MOTION, checkInvariants, totalTime, derived } from '../src/lib/bookMotion.js'

const sets = {
  'defaults': {},
  'bouncy (e 0.8)': { restitution: 0.8 },
  'dead landing (e 0.2)': { restitution: 0.2 },
  'no wobble (zeta 1)': { zeta: 1 },
  'over-damped (zeta 1.4)': { zeta: 1.4 },
  'two turns, tall hop': { turns: 2, hopHeight: 120, hopTime: 0.8 },
  'slow spring (omega 6)': { omega: 6 },
  'book-list loop (the real one)': LOOP_MOTION,
}

let failed = 0
for (const [name, params] of Object.entries(sets)) {
  const merged = { ...BOOK_MOTION, ...params }
  const rules = checkInvariants(merged)
  const bad = rules.filter((r) => !r.pass)
  const d = derived(merged)
  console.log(`\n${name}  (T = ${totalTime(merged).toFixed(3)} s, g = ${d.gravity.toFixed(0)} px/s², flip overshoot ${(d.overshoot * 100).toFixed(1)}%)`)
  for (const r of rules) {
    const mark = r.pass ? 'ok  ' : r.kind === 'design' ? 'warn' : 'FAIL'
    if (!r.pass || process.argv.includes('--all')) console.log(`  ${mark} ${r.rule}: expected ${r.expected.toPrecision(6)}, got ${r.actual.toPrecision(6)}`)
  }
  const hard = bad.filter((r) => r.kind !== 'design')
  console.log(`  ${rules.length - bad.length}/${rules.length} rules hold${bad.length ? `, ${hard.length} maths failures, ${bad.length - hard.length} design warnings` : ''}`)
  failed += hard.length
}

console.log(failed ? `\n${failed} maths rule(s) failed.` : '\nAll maths rules hold for every set.')
process.exit(failed ? 1 : 0)
