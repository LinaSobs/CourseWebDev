// A soft, calm scene behind My account: a pale morning sky fading to peach, a low sun glow, a few clouds,
// little sparkles, and rolling hills in the site's blue, mint and coral at the bottom of the page.
// Pure CSS gradients + inline SVG, NO animation and no filters, so it costs almost nothing to draw.
// Decoration only: aria-hidden, no clicks, always behind the cards.

export default function ProfileBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pb-scene pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
      style={{
        background:
          'radial-gradient(45% 30% at 82% 10%, rgba(255,226,170,0.75), transparent 70%), radial-gradient(60% 40% at 10% 0%, rgba(124,196,255,0.35), transparent 70%), linear-gradient(180deg, #e8f3ff 0%, #f3f8ff 40%, #fff3ee 78%, #ffe9e3 100%)',
      }}
    >
      {/* clouds */}
      <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMin slice" className="pb-cloud absolute inset-x-0 top-0 h-[220px] w-full" fill="#ffffff">
        <g opacity="0.85">
          <path d="M120 120c0-22 18-40 40-40 8 0 15 2 21 6 8-16 25-26 44-26 27 0 49 21 50 47 18 1 33 16 33 34H90c-17 0-30-12-30-27 0-14 24-1 60 6z" />
          <path d="M760 70c0-18 15-33 33-33 7 0 13 2 18 5 7-13 21-21 36-21 22 0 40 17 41 38 15 1 27 13 27 28H735c-14 0-25-10-25-22 0-12 20-1 50 5z" opacity="0.8" />
          <path d="M980 190c0-14 12-26 26-26 5 0 10 1 14 4 6-10 16-16 28-16 17 0 31 13 32 30 12 1 21 10 21 22H962c-11 0-19-8-19-17 0-9 16-1 37 3z" opacity="0.7" />
        </g>
      </svg>

      {/* sparkles */}
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMin slice" className="absolute inset-x-0 top-0 h-[420px] w-full">
        <g fill="#7cc4ff" opacity="0.55">
          <path d="M300 90l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          <path d="M560 200l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
          <path d="M1040 300l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        </g>
        <g fill="#ffb3a7" opacity="0.7">
          <path d="M150 260l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
          <path d="M820 150l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          <path d="M440 330l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        </g>
      </svg>

      {/* hills, anchored to the bottom of the page */}
      <svg viewBox="0 0 1200 360" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[260px] w-full md:h-[340px]">
        <path d="M0 150C160 90 320 80 480 120S800 190 1000 120 1130 90 1200 100V360H0Z" className="pb-hill-1" fill="#cfe8ff" />
        <path d="M0 210C180 150 360 150 540 190S860 250 1050 190 1150 170 1200 175V360H0Z" className="pb-hill-2" fill="#bdeedb" />
        <path d="M0 270C200 230 380 230 560 262S900 310 1080 266 1160 250 1200 252V360H0Z" className="pb-hill-3" fill="#ffc9c0" />
        <path d="M0 320C240 296 420 296 620 316S960 342 1200 308V360H0Z" className="pb-hill-4" fill="#ffb3a7" opacity="0.8" />
      </svg>
    </div>
  )
}
