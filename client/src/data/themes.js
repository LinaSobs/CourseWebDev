// How the pages look. Every reader group now shares ONE light theme (sky blue, light red, white cards),
// so the whole site feels like the same shop. To change the look of everything, edit `light` below
// (colours live in src/styles/tokens.css, the type scale in src/styles/typography.css).
// Class names are written out in full so Tailwind can find them.

// Colours here follow the active theme: `bg-skin-*`, `bg-ink-soft`, `bg-paper` are variables that change in the Night theme
// (src/styles/theme-night.css). A few gradients carry an explicit `dark:` version because they use fixed pastel colours.
const light = {
  // one font setup for every section: body text in DM Sans (inherited), headings use the .t-* classes (Bricolage Grotesque)
  font: 'font-body',
  header: 'bg-skin-surface/90 text-ink border-b border-line backdrop-blur',
  navBg: 'bg-skin-surface',
  navLink: 'text-ink md:text-ink/75 md:hover:text-blue',
  logoAccent: 'text-blue',
  contactBtn: 'bg-skin-accent text-white',
  closeLink: 'text-blue',
  pill: 'btn skin-btn skin-btn-soft',

  // hero: the SAME moving background on the home page, every shelf and Research & Book
  heroVideo: 'video/hero.mp4',
  heroPoster: 'video/hero-poster.jpg',
  heroVideoCls: 'opacity-70',
  videoBtn: 'bg-ink/70 text-paper',
  // light wash so the dark text stays readable, but thin enough that the video really shows through
  heroShade: 'bg-linear-to-b from-skin-surface/75 to-[#dff1ff]/50 lg:bg-linear-to-r lg:from-skin-surface/90 lg:via-[#e8f4ff]/55 lg:to-[#dff1ff]/25 dark:to-[#0f2036]/60 dark:lg:via-[#0f2036]/60 dark:lg:to-[#0f2036]/30',
  heroBg: 'bg-linear-to-br from-[#dff1ff] to-[#ffe9e6] text-ink dark:from-[#0f2036] dark:to-[#2a1a22]',
  heroPattern: '[background-image:radial-gradient(rgba(15,109,187,0.10)_2px,transparent_2px)] [background-size:28px_28px]',
  heroHeading: 't-display',
  accent: 'text-blue',
  kicker: 't-eyebrow',
  intro: 't-lede',
  cta: 'skin-btn',
  coverCls: 'rounded-xl shadow-[0_18px_36px_rgba(18,38,63,0.20)]',
  fanAnim: 'animate-float motion-reduce:animate-none',

  pointsBg: 'bg-ink-soft text-ink',
  pointTitle: 't-title',
  pointText: 't-body',

  shelfBg: 'bg-paper text-ink',
  shelfPattern: '',
  shelfHeading: 't-section',
  shelfNote: 't-lede',
  filterLabel: 't-title',
  filterCount: 't-meta',

  card: 'skin-card card-lift',
  cardTitle: 't-card-title',
  cardMeta: 't-meta',
  cardBlurb: 't-body',
  cardPrice: 'font-display text-blue',
  order: 'btn skin-btn',
  badge: 'bg-coral text-ink',
  stepper: 'border-line bg-ink-soft text-ink',

  tileShape: 'skin-card',
  tileLine: 't-body',
  tileCta: 'text-blue',
}

export const themes = {
  home: light,
  kids: light,
  teens: light,
  adults: light,
  students: light,
  scientists: light,
}

// What the app says, in each shelf's own voice. Cart, account and shelf messages read from here,
// so the words change with the colours instead of staying the same everywhere.
export const voices = {
  home: {
    greeting: (name) => `Hi, ${name}`,
    cartEmpty: 'Your cart is empty. Let’s fix that.',
    cartCta: 'Find a book',
    thanks: 'Thank you!',
    thanksLine: 'is on its way to being packed.',
    wishlistEmpty: 'Nothing saved yet. Tap the heart on any book to keep it here.',
    ordersEmpty: 'No orders yet. Your first one will show up here.',
    noResults: 'Nothing here for that search and price range.',
    clear: 'Clear search and filters',
    icon: '📚',
  },
  kids: {
    greeting: (name) => `Hi ${name}! 🎉`,
    cartEmpty: 'Your bag is empty! Let’s fill it with stories.',
    cartCta: 'Go find a book',
    thanks: 'Hooray!',
    thanksLine: 'is getting packed right now.',
    wishlistEmpty: 'No hearts yet! Tap the heart on a book you love.',
    ordersEmpty: 'No orders yet. Your first adventure is waiting!',
    noResults: 'Hmm, no books like that. Try another word!',
    clear: 'Start again',
    icon: '🐻',
  },
  teens: {
    greeting: (name) => `What’s up, ${name}`,
    cartEmpty: 'Nothing in here. Go grab something good.',
    cartCta: 'Browse the shelf',
    thanks: 'Locked in.',
    thanksLine: 'is on the way.',
    wishlistEmpty: 'Your list is empty. Heart whatever looks good.',
    ordersEmpty: 'No orders yet. First one’s always the best.',
    noResults: 'Nada. Try something else.',
    clear: 'Reset',
    icon: '⚡',
  },
  adults: {
    greeting: (name) => `Good to see you, ${name}`,
    cartEmpty: 'Your cart is empty. A good book is waiting.',
    cartCta: 'Browse the shelves',
    thanks: 'Thank you.',
    thanksLine: 'is being prepared for you.',
    wishlistEmpty: 'Nothing saved yet. Tap the heart on a book to keep it for later.',
    ordersEmpty: 'No orders yet. Your first will appear here.',
    noResults: 'Nothing matched that search.',
    clear: 'Clear search and filters',
    icon: '🖋️',
  },
  students: {
    greeting: (name) => `Hey ${name}, let’s get studying`,
    cartEmpty: 'Empty cart. Add your reading list.',
    cartCta: 'Find a study book',
    thanks: 'Nice one!',
    thanksLine: 'is getting packed.',
    wishlistEmpty: 'No saved books yet. Heart the ones you need for later.',
    ordersEmpty: 'No orders yet. Your first one shows up here.',
    noResults: 'No match. Try a different title or author.',
    clear: 'Clear search and filters',
    icon: '✏️',
  },
  scientists: {
    greeting: (name) => `Welcome back, ${name}`,
    cartEmpty: 'Cart is empty. Add some references.',
    cartCta: 'Browse the shelf',
    thanks: 'Order logged.',
    thanksLine: 'is being packed.',
    wishlistEmpty: 'No saved titles. Heart anything worth citing later.',
    ordersEmpty: 'No orders recorded yet.',
    noResults: 'No results for that query.',
    clear: 'Clear query and filters',
    icon: '🔬',
  },
}
