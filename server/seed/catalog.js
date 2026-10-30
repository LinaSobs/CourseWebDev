// SEED DATA. This is the old hardcoded src/data/books.js, moved to the server.
// It is only read by scripts/seed.js, which copies it into Postgres. After that the website
// gets its books from the API, not from this file.
// `id` doubles as the cover file name: client/public/assets/covers/<id>.svg

export const books = [

  // Kids
  { id: 'moon-bakery', title: 'The Moon Bakery', author: 'T. Alvarez', detail: 'Ages 3-6', category: 'bedtime', ages: [3, 6], blurb: 'A baker, a very sleepy moon and the night they swap jobs.', price: 11.5, group: 'kids', isNew: true },
  { id: 'little-atlas', title: 'Little Atlas of Everything', author: 'P. Moreau', detail: 'Ages 4-7', category: 'learn', ages: [4, 7], blurb: 'A picture book tour of oceans, mountains and very small countries.', price: 12.99, group: 'kids' },
  { id: 'mango-season', title: 'Mango Season', author: 'N. Perera', detail: 'Ages 6-9', category: 'first-readers', ages: [6, 9], blurb: 'Two cousins, one tree and a very long summer in Colombo.', price: 11.5, group: 'kids' },
  { id: 'captain-pebble', title: "Captain Pebble's Big Dive", author: 'R. Lindgren', detail: 'Ages 7-10', category: 'adventure', ages: [7, 10], blurb: 'A tiny submarine, a huge reef and a mystery with fins.', price: 13.25, group: 'kids' },
  { id: 'hello-little-fox', title: 'Hello, Little Fox', author: 'T. Brandt', detail: 'Ages 3-5', category: 'picture-books', ages: [3, 5], blurb: 'Fox says hello to everyone in the forest. Everyone says it back, loudly.', price: 9.99, group: 'kids', isNew: true },
  { id: 'loud-whisper', title: 'The Very Loud Whisper', author: 'M. Osei', detail: 'Ages 3-6', category: 'picture-books', ages: [3, 6], blurb: 'Nobody can keep a secret in this house. Least of all Mina.', price: 10.5, group: 'kids' },
  { id: 'blue-bear', title: 'Blue Bear’s Big Day', author: 'C. Ferreira', detail: 'Ages 3-5', category: 'picture-books', ages: [3, 5], blurb: 'One bear, one very big day and one very small umbrella.', price: 10.25, group: 'kids' },
  { id: 'pip-can-read', title: 'Pip Can Read', author: 'L. Hartmann', detail: 'Ages 4-6', category: 'first-readers', ages: [4, 6], blurb: 'Short words, big pictures and a hen who is learning to read.', price: 8.99, group: 'kids' },
  { id: 'zebra-crossing', title: 'Zara and the Zebra Crossing', author: 'A. Mwangi', detail: 'Ages 5-7', category: 'first-readers', ages: [5, 7], blurb: 'Zara has to cross the road. The zebra has other ideas.', price: 9.75, group: 'kids', isNew: true },
  { id: 'ten-tractors', title: 'Ten Tiny Tractors', author: 'J. Kowalski', detail: 'Ages 4-6', category: 'first-readers', ages: [4, 6], blurb: 'Count down from ten as the tractors head home for supper.', price: 8.75, group: 'kids' },
  { id: 'goodnight-town', title: 'Goodnight, Little Town', author: 'S. Ito', detail: 'Ages 3-5', category: 'bedtime', ages: [3, 5], blurb: 'The shops close, the lights dim and the whole town gets sleepy.', price: 10.99, group: 'kids' },
  { id: 'sleepy-keeper', title: 'The Sleepy Lighthouse Keeper', author: 'B. Andersson', detail: 'Ages 4-7', category: 'bedtime', ages: [4, 7], blurb: 'Who keeps the light on when the keeper falls asleep?', price: 11.75, group: 'kids' },
  { id: 'counting-stars', title: 'Counting Stars with Nana', author: 'D. Rahman', detail: 'Ages 3-6', category: 'bedtime', ages: [3, 6], blurb: 'One star, two stars and a grandmother who knows all their names.', price: 10.5, group: 'kids' },
  { id: 'rainbow-work', title: 'How Does a Rainbow Work?', author: 'E. Novak', detail: 'Ages 5-8', category: 'learn', ages: [5, 8], blurb: 'Light, rain and why you can never find the end of one.', price: 12.5, group: 'kids', isNew: true },
  { id: 'first-numbers', title: 'My First Book of Numbers', author: 'H. Tanaka', detail: 'Ages 3-5', category: 'learn', ages: [3, 5], blurb: 'Count apples, ducks and bubbles from one to twenty.', price: 9.5, group: 'kids' },
  { id: 'planet-pals', title: 'Planet Pals', author: 'V. Castillo', detail: 'Ages 6-9', category: 'learn', ages: [6, 9], blurb: 'Meet the eight planets, who each have a very strong personality.', price: 13.5, group: 'kids' },
  { id: 'tuk-island', title: 'The Treasure of Tuk Island', author: 'O. Bergstrom', detail: 'Ages 8-10', category: 'adventure', ages: [8, 10], blurb: 'A torn map, a leaky boat and a treasure that is not gold.', price: 13.99, group: 'kids' },
  { id: 'dragon-post', title: 'Dragon Post', author: 'F. Adeyemi', detail: 'Ages 7-10', category: 'adventure', ages: [7, 10], blurb: 'Nell delivers letters by dragon. Today the dragon has a cold.', price: 12.75, group: 'kids', isNew: true },
  { id: 'time-bus', title: 'Zoe and the Time-Travel Bus', author: 'R. Silva', detail: 'Ages 7-10', category: 'adventure', ages: [7, 10], blurb: 'Bus 42 goes everywhere, including last Tuesday.', price: 13.25, group: 'kids' },
  { id: 'colouring-animals', title: 'The Big Colouring Book of Animals', author: 'G. Laurent', detail: 'Ages 3-8', category: 'activity', ages: [3, 8], blurb: 'Sixty animals to colour, from sloths to sea horses.', price: 8.5, group: 'kids' },
  { id: 'doodle-dream', title: 'Doodle, Draw, Dream', author: 'K. Yamamoto', detail: 'Ages 5-9', category: 'activity', ages: [5, 9], blurb: 'Half-finished drawings that need you to finish them.', price: 9.99, group: 'kids' },
  { id: 'sticker-safari', title: 'Sticker Safari', author: 'Y. Dlamini', detail: 'Ages 4-8', category: 'activity', ages: [4, 8], blurb: 'Over two hundred stickers and a savannah to put them on.', price: 10.99, group: 'kids', isNew: true },

  // Teens
  { id: 'glass-orbit', title: 'Glass Orbit', author: 'K. Mbeki', detail: 'Ages 13+', category: 'fantasy-scifi', blurb: 'Four teenagers on a failing space station and one working radio.', price: 14.99, group: 'teens', isNew: true },
  { id: 'lighthouse', title: 'The Last Lighthouse Club', author: 'H. Nakamura', detail: 'Ages 12+', category: 'mystery', blurb: 'A summer club, a locked tower and a secret the town buried.', price: 13.5, group: 'teens' },
  { id: 'static', title: 'Static', author: 'J. Okoye', detail: 'Ages 14+', category: 'fantasy-scifi', blurb: "She can hear everyone's messages. Then she hears her own.", price: 15.25, group: 'teens' },
  { id: 'roll-initiative', title: 'Roll for Initiative', author: 'S. Duarte', detail: 'Ages 12+', category: 'real-life', blurb: 'A tabletop group, a new kid and a campaign that gets real.', price: 12.75, group: 'teens' },
  { id: 'neon-harbour', title: 'Neon Harbour', author: 'I. Petrov', detail: 'Ages 14+', category: 'mystery', blurb: 'Every night the harbour lights spell something different.', price: 14.25, group: 'teens', isNew: true },
  { id: 'skyward-fifteen', title: 'Skyward Fifteen', author: 'A. Nwosu', detail: 'Ages 13+', category: 'fantasy-scifi', blurb: 'The sky tower opens once a year. This year Amara is fifteen.', price: 15.5, group: 'teens' },
  { id: 'summer-rewrote', title: 'The Summer I Rewrote Everything', author: 'L. Costa', detail: 'Ages 13+', category: 'real-life', blurb: 'New town, new school and a notebook where she edits her own story.', price: 12.99, group: 'teens' },
  { id: 'ink-echo', title: 'Ink & Echo', author: 'M. Sato', detail: 'Ages 12+', category: 'graphic', blurb: 'A graphic novel about two artists who share one sketchbook.', price: 16.5, group: 'teens' },

  // Adults
  { id: 'global-novel', title: 'The Global Novel', author: 'A. Writer', detail: 'Fiction', category: 'fiction', blurb: 'A family saga that follows one recipe across four continents.', price: 19.99, group: 'adults' },
  { id: 'across-borders', title: 'Across Borders', author: 'B. Author', detail: 'Non-fiction', category: 'non-fiction', blurb: 'Reporting from twelve border crossings and the people who use them daily.', price: 17.5, group: 'adults' },
  { id: 'cartographer', title: "The Cartographer's Daughter", author: 'E. Ruiz', detail: 'Fiction', category: 'fiction', blurb: "A girl inherits her father's unfinished map and sets out to finish it.", price: 15.99, group: 'adults' },
  { id: 'salt-road', title: 'The Salt Road', author: 'L. Okafor', detail: 'History', category: 'history', blurb: 'How one mineral crossed the Sahara and shaped half a continent.', price: 18.25, group: 'adults' },
  { id: 'slow-kitchen', title: 'Slow Kitchen', author: 'P. Haddad', detail: 'Food', category: 'lifestyle', blurb: 'Recipes that take all afternoon and are worth every minute.', price: 24.5, group: 'adults', isNew: true },
  { id: 'hundred-trains', title: 'One Hundred Train Rides', author: 'T. Eriksen', detail: 'Travel', category: 'lifestyle', blurb: 'A year of slow trains across eleven countries, with timetables.', price: 21.99, group: 'adults' },
  { id: 'quiet-archive', title: 'The Quiet Archive', author: 'N. Bianchi', detail: 'Fiction', category: 'fiction', blurb: 'A librarian finds the same name in every box she opens.', price: 16.75, group: 'adults', isNew: true },
  { id: 'old-bridges', title: 'Bridges of the Old World', author: 'C. Mendes', detail: 'History', category: 'history', blurb: 'The engineers, the rivers and the stubborn people who joined cities.', price: 19.5, group: 'adults' },

  // Students
  { id: 'stats-curious', title: 'Statistics for the Curious', author: 'R. Haddad', detail: 'Academic', category: 'textbooks', blurb: 'Probability and inference, with worked examples.', price: 39, group: 'students' },
  { id: 'systems-fast', title: 'Thinking in Systems, Fast', author: 'J. Weber', detail: 'Study guide', category: 'study-guides', blurb: 'A short guide to feedback loops in work, cities and daily life.', price: 22, group: 'students' },
  { id: 'calculus-tears', title: 'Calculus Without Tears', author: 'M. Fischer', detail: 'Textbook', category: 'textbooks', blurb: 'Limits, derivatives and integrals, explained like a friend would.', price: 34.5, group: 'students' },
  { id: 'essay-weekend', title: 'Essay Writing in a Weekend', author: 'S. Banerjee', detail: 'Study guide', category: 'study-guides', blurb: 'From blank page to finished essay in two days, with templates.', price: 18.99, group: 'students', isNew: true },
  { id: 'exam-survival', title: 'The Exam Season Survival Kit', author: 'O. Lindqvist', detail: 'Exam prep', category: 'exam-prep', blurb: 'Revision plans, memory tricks and what to eat on exam day.', price: 16.5, group: 'students' },
  { id: 'german-busy', title: 'German for Busy People', author: 'A. Keller', detail: 'Languages', category: 'languages', blurb: 'Twenty minutes a day, A1 to B1, with audio you can actually follow.', price: 25, group: 'students', isNew: true },

  // Scientists
  { id: 'deep-blue', title: 'Deep Blue', author: 'S. Lindqvist', detail: 'Science', category: 'science', blurb: "A marine biologist's year on a North Atlantic research ship.", price: 21.5, group: 'scientists' },
  { id: 'learning-machines', title: 'Learning Machines', author: 'D. Innovator', detail: 'Academic', category: 'academic', blurb: 'Machine learning from first principles, no hype.', price: 42, group: 'scientists', isNew: true },
  { id: 'living-cell', title: 'The Living Cell', author: 'R. Abdi', detail: 'Science', category: 'science', blurb: 'A tour of one cell, one organelle at a time.', price: 23.5, group: 'scientists' },
  { id: 'quantum-questions', title: 'Quantum Questions', author: 'J. Moreno', detail: 'Academic', category: 'academic', blurb: 'The questions physicists still argue about, with the maths included.', price: 46, group: 'scientists' },
  { id: 'methods-work', title: 'Research Methods That Work', author: 'E. Paulsen', detail: 'Reference', category: 'reference', blurb: 'Designing studies, picking tests and avoiding the usual traps.', price: 38, group: 'scientists', isNew: true },
  { id: 'writing-paper', title: 'Writing the Paper', author: 'H. Okonkwo', detail: 'Reference', category: 'reference', blurb: 'From first draft to reviewer two, a field guide for authors.', price: 27.5, group: 'scientists' },
]

// The reader groups. Each one gets its own page (see themes.js for how each page looks).
// The shop has two halves: the Kids Corner (world 'kids') and the main shop (world 'general': teens, adults, students, scientists).
// `categories` are the sections inside a shelf; each book has one of them.
// In `headline`, the bit between *stars* gets the accent colour.
const baseGroups = [
  {
    id: 'kids', title: 'Kids', homeLine: 'Picture books, bedtime, learning and activities for ages 3 to 10',
    kicker: 'Ages 3 to 10', headline: 'Stories that are *all yours!*',
    intro: "Big pictures, funny friends and adventures from the moon to the deep blue reef. Pick one and let's read!",
    cta: 'Show me the books', shelfTitle: 'Pick a story', shelfNote: 'Picture books, bedtime stories, learning and activity books for ages 3 to 10.',
    points: [
      { title: 'Big, bright pictures', text: 'Made for pointing at and giggling over.' },
      { title: 'Read-aloud friendly', text: 'Short, fun stories for bedtime or any time.' },
      { title: 'Grown-up approved', text: 'Fair prices and 30-day returns.' },
    ],
  },
  {
    id: 'teens', title: 'Teens', homeLine: 'Ages 12 and up. No talking down.',
    kicker: 'Ages 12+', headline: 'Real stories. *Real stakes.*',
    intro: 'No talking down. Space stations, secrets and campaigns that actually get you.',
    cta: 'See the books', shelfTitle: 'The good stuff', shelfNote: 'Stories with bigger stakes, ages 12 and up.',
    points: [
      { title: 'No talking down', text: "Stories that treat you like the reader you are." },
      { title: 'Stories with stakes', text: 'Failing stations, buried secrets, campaigns that get real.' },
      { title: 'Shipped worldwide', text: 'Tracked to your door in 180+ countries.' },
    ],
  },
  {
    id: 'adults', title: 'Adults', homeLine: 'Fiction, history and big ideas',
    kicker: 'Fiction · History · Ideas', headline: 'Time for a *good read.*',
    intro: 'Considered fiction, history and reportage, chosen for readers who like to take their time.',
    cta: 'Browse the shelf', shelfTitle: 'The shelf', shelfNote: 'Novels, history and big ideas for the long evening.',
    points: [
      { title: 'Considered picks', text: 'Fiction, history and reportage worth your evening.' },
      { title: 'Take your time', text: '30 days to return anything, no questions.' },
      { title: 'Delivered anywhere', text: 'Tracked shipping to 180+ countries.' },
    ],
  },
  {
    id: 'students', title: 'Students', homeLine: 'Study guides and textbooks',
    kicker: 'Study guides & textbooks', headline: 'Study smarter, *not longer.*',
    intro: 'Clear study guides and readable academic texts for lectures, exams and everything in between.',
    cta: 'Find my study guide', shelfTitle: 'Study shelf', shelfNote: 'Study guides and academic reads that are actually readable.',
    points: [
      { title: 'Plain language', text: 'Guides and texts that are actually readable.' },
      { title: 'Worked examples', text: "Because reading about it isn't the same as doing it." },
      { title: 'Fair prices', text: 'No surprise fees, easy returns.' },
    ],
  },
  {
    id: 'scientists', title: 'Research & Book', homeLine: 'Research reads and first principles',
    kicker: 'Reading list', headline: 'Rigour, *without the hype.*',
    intro: 'Field notes and first principles, written by people who do the work, for people who do the work.',
    cta: 'View the reading list', shelfTitle: 'The reading list', shelfNote: 'Science and machine learning, from the field to first principles.',
    points: [
      { title: 'Rigour over hype', text: 'First principles and careful claims.' },
      { title: 'Written from the field', text: 'Whole research years, not summaries.' },
      { title: 'Tracked worldwide', text: 'Shipped to 180+ countries.' },
    ],
  },
]

const extras = {
  kids: {
    world: 'kids',
    categories: [
      { id: 'picture-books', label: 'Picture books', icon: '🖼️' },
      { id: 'first-readers', label: 'First readers', icon: '🔤' },
      { id: 'bedtime', label: 'Bedtime', icon: '🌙' },
      { id: 'learn', label: 'Learn & explore', icon: '🔭' },
      { id: 'adventure', label: 'Adventure', icon: '🗺️' },
      { id: 'activity', label: 'Colouring & activity', icon: '🎨' },
    ],
  },
  teens: {
    world: 'general',
    categories: [
      { id: 'fantasy-scifi', label: 'Sci-fi & fantasy', icon: '🚀' },
      { id: 'mystery', label: 'Mystery', icon: '🔍' },
      { id: 'real-life', label: 'Real life', icon: '🎒' },
      { id: 'graphic', label: 'Graphic novels', icon: '💬' },
    ],
  },
  adults: {
    world: 'general',
    categories: [
      { id: 'fiction', label: 'Fiction', icon: '📖' },
      { id: 'non-fiction', label: 'Non-fiction', icon: '📰' },
      { id: 'history', label: 'History', icon: '🏛️' },
      { id: 'lifestyle', label: 'Food & travel', icon: '🧳' },
    ],
  },
  students: {
    world: 'general',
    categories: [
      { id: 'textbooks', label: 'Textbooks', icon: '📘' },
      { id: 'study-guides', label: 'Study guides', icon: '📝' },
      { id: 'exam-prep', label: 'Exam prep', icon: '⏰' },
      { id: 'languages', label: 'Languages', icon: '🌍' },
    ],
  },
  scientists: {
    world: 'general',
    categories: [
      { id: 'science', label: 'Popular science', icon: '🧬' },
      { id: 'academic', label: 'Academic', icon: '🎓' },
      { id: 'reference', label: 'Methods & reference', icon: '📐' },
    ],
  },
}

export const groups = baseGroups.map((g) => ({ ...g, ...extras[g.id] }))
