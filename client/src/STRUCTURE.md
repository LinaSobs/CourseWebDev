# GlobalBooks `src/` folder guide

Every page has its own folder. The JSX files and the page's CSS live together, so everything
about a page is in one place.

```
src/
├── index.css            Entry point: only @import lines + the cascade order (read its header first)
├── main.jsx, App.jsx    Starts the app; App picks the page from the address (#/...)
│
├── styles/              GLOBAL CSS (no JSX): the same on every page
│   ├── tokens.css        colours, fonts, easing, skin variables (the light theme)
│   ├── theme-night.css   the second theme: the same variables, darker, under html[data-theme="dark"]
│   ├── animations.css    @keyframes
│   ├── base.css          html/body defaults, focus ring, gutters
│   ├── ui-kit.css        .skin-card  .skin-btn*  .skin-input
│   ├── dialogs.css       dialog.drawer / dialog.popup
│   ├── typography.css    .t-display  .t-section  .t-title ...
│   ├── controls.css      .btn  .chip  .badge  .card-lift
│   ├── scroll-effects.css  .reveal  .fab-away
│   ├── accessibility.css reduced motion / contrast / forced colours
│   └── kill-switch.css   .skin-reduce-fx for slow devices (imported last)
│
├── layout/              The app shell that is on every page
│   ├── Header/           Header.jsx, SlidingTabs.jsx, Header.css
│   ├── Footer/  CartDrawer/  AuthDialog/  Toast/  ChatFab/
│   └── Main/             Main.jsx: shows the page for the current route
│
├── pages/               One folder per page: JSX + its CSS together
│   ├── Home/             Home.jsx + Hero, Chooser, KidsBanner, Marquee, Perks, FeatureBook, Watch, Newsletter, Contact + Home.css
│   ├── Shelf/            AudiencePage, Shelf, BookCard, Decor, ... + Shelf.css   (Kids, Teens, Students ...)
│   ├── Account/          AccountPage, ProfilePanel, primitives, ProfileBackdrop, useAccountData + Account.css
│   ├── Research/         ResearchPage, cards, Modal, OrderModal, SearchModal, bits + Research.css
│   └── MotionLab/        MotionLab.jsx + MotionLab.css
│
├── shared/              Used by more than one page
│   ├── PageHero/ PurchasedBook/ MathPlane/   (JSX + CSS)
│   ├── LoadMore.jsx      the "More" button: shows 5 cards, 5 more per press (PAGE_SIZE) + useLoadMore hook
│   ├── AdvancedToggle.jsx  the "Advanced search" button that opens/closes a filter panel
│   └── Button, Container, Stepper, BackgroundVideo, ErrorBoundary
│
└── context/  data/  lib/   State, static data, helpers (unchanged)
```

## Adding or changing styles

* **Page-only style** -> the CSS file inside that page's folder.
* **Used on several pages** -> `styles/` (or the `shared/<Part>/` folder if it belongs to one component).
* **New CSS file** -> add one `@import` line to `index.css` in the right group. Order matters: later wins.
* Every CSS file starts with a header: what it is for, which JSX uses it, and a class index.
