// Starter content for the Research & Book page.
//
//  - PAPERS are real, well-known papers (real authors, venues, DOIs/arXiv ids). The abstracts are my own short
//    plain-language summaries, not the originals. Please open each pdf link once before you hand the project in.
//  - NEWS articles are sample explainers written for this project (staff bylines are made up). Replace them with
//    real stories, or keep them as demo content.
//  - BOOKS are placeholder titles with made-up authors and made-up (but checksum-valid) ISBNs.

// ISBN-13 needs a correct last digit, so we calculate it instead of typing it by hand.
const isbn13 = (twelve) => {
  const sum = [...twelve].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0)
  return `${twelve}${(10 - (sum % 10)) % 10}`
}

export const authors = {
  mara: { name: 'Mara Lindqvist', affiliation: 'Research & Book desk' },
  daniel: { name: 'Daniel Okafor', affiliation: 'Research & Book desk' },
  priya: { name: 'Priya Raman', affiliation: 'Research & Book desk' },
  tomas: { name: 'Tomás Herrera', affiliation: 'Research & Book desk' },
}

// daysAgo makes the feed chronological and fresh whenever you seed.
export const news = [
  {
    slug: 'attention-replaced-recurrence', featured: true, daysAgo: 0, category: 'AI', image: 'news-attention',
    alt: 'Heat map of attention weights between positions in a sentence',
    title: 'The 2017 paper behind every modern chatbot, and the one idea it bet on',
    summary: 'Attention Is All You Need dropped recurrence and let every word look at every other word. Nearly all large language models still run on that choice.',
    body: 'Before 2017, most language models read text one word at a time and tried to carry what mattered in a running memory. The Transformer paper replaced that memory with attention: for each position, the model scores how relevant every other position is and takes a weighted mix.\n\nTwo things made it stick. Attention can be computed for the whole sentence at once, so training parallelises well on modern hardware. And the same block can be stacked again and again, so scaling up is mostly a matter of making the stack bigger.\n\nThe hero image is a toy attention map: bright cells mean a position is paying close attention to another one. Read the paper itself in the Research section; it is shorter than most people expect.',
    authors: ['mara'], lead: 'mara',
  },
  {
    slug: 'why-findings-are-false', daysAgo: 1, category: 'Methods', image: 'news-replication',
    alt: 'Funnel plot of effect sizes against standard error with a skewed edge',
    title: 'Why a published result can be wrong, and how to read headlines with that in mind',
    summary: 'Small studies, flexible analysis and a bias toward exciting results can all push false findings into print. A famous 2005 essay put numbers on it.',
    body: 'John Ioannidis argued that whether a finding is likely to be true depends on more than its p-value: how many hypotheses were being tested in the field, how large the study was, and how much room the analysts had to choose their approach.\n\nThe picture shows a funnel plot. In an unbiased literature the dots spread evenly around the true effect. When only exciting results get shown, one side of the funnel goes missing, and the average of what is published drifts away from the truth.\n\nA practical habit: ask how big the study was, whether it was pre-registered, and whether anyone else has found the same thing.',
    authors: ['daniel', 'priya'], lead: 'daniel',
  },
  {
    slug: 'shannon-and-the-bit', daysAgo: 2, category: 'Information theory', image: 'news-entropy',
    alt: 'Binary entropy curve peaking at one bit when both outcomes are equally likely',
    title: 'Shannon’s bit: how a 1948 paper made information something you can measure',
    summary: 'Entropy tells you how many yes/no questions an unpredictable source costs you. It underlies compression, error correction and a lot of machine learning.',
    body: 'A coin that always lands heads carries no surprise, so it needs no bits to describe. A fair coin is the hardest to predict and needs exactly one. Shannon’s entropy is the curve in the image: zero at the extremes, one bit in the middle.\n\nFrom that single definition came limits on how far data can be compressed and how fast it can be sent reliably over a noisy channel. The same quantity shows up today as the cross-entropy loss used to train classifiers.',
    authors: ['tomas'], lead: 'tomas',
  },
  {
    slug: 'dropout-explained', daysAgo: 3, category: 'Machine learning', image: 'news-dropout',
    alt: 'A small neural network with some units crossed out',
    title: 'Dropout, explained: making a network stronger by randomly breaking it',
    summary: 'Switch off a random share of units on every training step and the network can no longer lean on any single one. The result generalises better.',
    body: 'Imagine a team where a random third of the people stay home each day. Nobody can be the only person who knows something, so knowledge spreads out. Dropout does that to a neural network.\n\nAt test time every unit is switched on again and the weights are scaled so the total signal matches what the network saw in training. It is cheap, simple, and still a default regulariser in many models.',
    authors: ['priya'], lead: 'priya',
  },
  {
    slug: 'two-cultures-quarter-century', daysAgo: 4, category: 'Statistics', image: 'news-cultures',
    alt: 'Scatter plot with a straight line and a wiggly high-degree fit',
    title: 'Two cultures of modelling, 25 years on',
    summary: 'Breiman split statisticians into those who model the data-generating process and those who just predict well. The argument has not gone away.',
    body: 'One camp assumes a stochastic model, such as a linear regression, and interprets its coefficients. The other treats the process as unknown and judges models by predictive accuracy on held-out data.\n\nThe chart shows why both worry: the straight line is easy to explain but misses structure, while the high-degree curve chases noise. Cross-validation is the shared referee.',
    authors: ['daniel'], lead: 'daniel',
  },
  {
    slug: 'residual-shortcuts', daysAgo: 6, category: 'Computer vision', image: 'news-residual',
    alt: 'Training error curves with and without shortcut connections',
    title: 'The shortcut that made very deep networks trainable',
    summary: 'Residual connections let a layer learn a small correction instead of a whole new representation. Depth stopped hurting.',
    body: 'Stacking more layers was supposed to help, yet plain deep networks trained worse than shallow ones. ResNets add a skip path so each block outputs its input plus a learned adjustment.\n\nThe gap in the chart is the practical win: the same number of steps gives lower error once gradients have an easy route back through the network.',
    authors: ['tomas', 'mara'], lead: 'tomas',
  },
  {
    slug: 'read-a-paper-in-three-passes', daysAgo: 8, category: 'Skills', image: 'news-passes',
    alt: 'Three nested bars labelled skim, read and re-derive',
    title: 'How to read a research paper in three passes',
    summary: 'Skim for the claim, read for the method, re-derive only what you must. Most papers deserve the first pass and nothing more.',
    body: 'Pass one takes five minutes: title, abstract, figures, conclusion. Decide whether the paper is worth more of your time. Pass two is an hour with the method and results, skipping the proofs. Pass three is for papers you need to build on: rebuild the argument yourself.\n\nBeginner-labelled papers in our Research section are a good place to practise.',
    authors: ['priya'], lead: 'priya',
  },
  {
    slug: 'gans-two-networks-one-game', daysAgo: 10, category: 'Machine learning', image: 'news-gan',
    alt: 'A generated distribution moving toward a real data distribution',
    title: 'GANs: two networks, one game',
    summary: 'A generator tries to fool a discriminator; the discriminator tries not to be fooled. Training is a tug-of-war that ends when fakes match reality.',
    body: 'The generator never sees real data directly. It only learns from whether the discriminator caught it. Over many rounds its output distribution slides toward the real one, as the shaded curves show.\n\nGANs are famously fiddly to train, which is part of why other generative approaches have since taken over many tasks, but the idea remains a clean example of learning through competition.',
    authors: ['mara'], lead: 'mara',
  },
  {
    slug: 'pick-your-first-methods-book', daysAgo: 12, category: 'Books', image: 'news-books',
    alt: 'Stacked bar chart of titles by difficulty level',
    title: 'Picking your first research-methods book: a level guide',
    summary: 'Every book in our shop now carries a difficulty badge. Here is how to choose where to start.',
    body: 'Beginner titles assume curiosity and nothing else. Intermediate titles expect you to be comfortable with basic statistics or code. Advanced titles expect you to read proofs.\n\nUse the level filter on the Books section to narrow the shelf, and the search box to find a topic across news, papers and books at once.',
    authors: ['daniel', 'tomas'], lead: 'daniel',
  },
]

export const papers = [
  {
    level: 'intermediate', date: '1948-07-01', source: 'Bell System Technical Journal, vol. 27', doi: '10.1002/j.1538-7305.1948.tb01338.x',
    pdf: 'https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf',
    title: 'A Mathematical Theory of Communication',
    abstract: 'Defines information as a measurable quantity, introduces entropy, and proves limits on how well messages can be compressed and sent over a noisy channel.',
    authors: ['Claude E. Shannon'],
  },
  {
    level: 'beginner', date: '2005-08-30', source: 'PLOS Medicine, 2(8): e124', doi: '10.1371/journal.pmed.0020124',
    pdf: 'https://journals.plos.org/plosmedicine/article/file?id=10.1371/journal.pmed.0020124&type=printable',
    title: 'Why Most Published Research Findings Are False',
    abstract: 'A short argument that study size, number of tested relationships, flexibility of analysis and bias together make many claimed findings more likely false than true.',
    authors: ['John P. A. Ioannidis'],
  },
  {
    level: 'beginner', date: '2001-08-01', source: 'Statistical Science, 16(3)', doi: '10.1214/ss/1009213726',
    pdf: 'https://doi.org/10.1214/ss/1009213726',
    title: 'Statistical Modeling: The Two Cultures',
    abstract: 'Contrasts modelling the data-generating process with algorithmic prediction, and argues statistics should make more room for the second approach.',
    authors: ['Leo Breiman'],
  },
  {
    level: 'intermediate', date: '2014-06-01', source: 'Journal of Machine Learning Research, 15', doi: null,
    pdf: 'https://jmlr.org/papers/volume15/srivastava14a/srivastava14a.pdf',
    title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting',
    abstract: 'Randomly removing units during training reduces overfitting. The paper explains the idea and tests it on vision, speech and text tasks.',
    authors: ['Nitish Srivastava', 'Geoffrey Hinton', 'Alex Krizhevsky', 'Ilya Sutskever', 'Ruslan Salakhutdinov'],
  },
  {
    level: 'intermediate', date: '2014-06-10', source: 'arXiv:1406.2661 (NeurIPS 2014)', doi: '10.48550/arXiv.1406.2661',
    pdf: 'https://arxiv.org/pdf/1406.2661',
    title: 'Generative Adversarial Networks',
    abstract: 'Trains a generator and a discriminator against each other, so the generator learns to produce samples the discriminator cannot tell from real data.',
    authors: ['Ian Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu', 'David Warde-Farley', 'Sherjil Ozair', 'Aaron Courville', 'Yoshua Bengio'],
  },
  {
    level: 'intermediate', date: '2015-12-10', source: 'arXiv:1512.03385 (CVPR 2016)', doi: '10.48550/arXiv.1512.03385',
    pdf: 'https://arxiv.org/pdf/1512.03385',
    title: 'Deep Residual Learning for Image Recognition',
    abstract: 'Adds shortcut connections so layers learn residual functions. Much deeper networks become easy to optimise and win image-recognition benchmarks.',
    authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
  },
  {
    level: 'advanced', date: '2014-12-22', source: 'arXiv:1412.6980 (ICLR 2015)', doi: '10.48550/arXiv.1412.6980',
    pdf: 'https://arxiv.org/pdf/1412.6980',
    title: 'Adam: A Method for Stochastic Optimization',
    abstract: 'An optimiser that keeps running estimates of the gradient’s first and second moments to set a separate step size for every parameter.',
    authors: ['Diederik P. Kingma', 'Jimmy Ba'],
  },
  {
    level: 'advanced', date: '2017-06-12', source: 'arXiv:1706.03762 (NeurIPS 2017)', doi: '10.48550/arXiv.1706.03762',
    pdf: 'https://arxiv.org/pdf/1706.03762',
    title: 'Attention Is All You Need',
    abstract: 'Introduces the Transformer, a sequence model built only from attention layers, which trains faster in parallel and set new translation results.',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
  },
  {
    level: 'advanced', date: '2018-10-11', source: 'arXiv:1810.04805 (NAACL 2019)', doi: '10.48550/arXiv.1810.04805',
    pdf: 'https://arxiv.org/pdf/1810.04805',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    abstract: 'Pre-trains a Transformer to predict masked words using context from both sides, then fine-tunes it for many language tasks with little extra work.',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
  },
]

// stock: 0 = sold out, small numbers show "low stock"
export const books = [
  { slug: 'deep-blue', title: 'Deep Blue', author: 'S. Lindqvist', level: 'beginner', category: 'Ocean science', price: 21.5, stock: 14, isbn: '979889100001', description: 'A marine biologist’s year on a North Atlantic research ship, written for anyone who has never seen a CTD rosette.' },
  { slug: 'living-cell', title: 'The Living Cell', author: 'R. Abdi', level: 'beginner', category: 'Biology', price: 23.5, stock: 3, isbn: '979889100002', description: 'A tour of one cell, one organelle at a time, with the chemistry explained in plain words.' },
  { slug: 'statistics-without-fear', title: 'Statistics Without Fear', author: 'M. Adeyemi', level: 'beginner', category: 'Statistics', price: 19, stock: 40, isbn: '979889100003', description: 'Means, spread, samples and p-values from zero, with no formulas you cannot read aloud.' },
  { slug: 'data-atlas', title: 'Atlas of Data Visualisation', author: 'L. Ferrari', level: 'beginner', category: 'Data visualisation', price: 28, stock: 22, isbn: '979889100004', description: 'Which chart for which question, with a page of before-and-after redesigns for every chart type.' },
  { slug: 'writing-paper', title: 'Writing the Paper', author: 'H. Okonkwo', level: 'intermediate', category: 'Academic writing', price: 27.5, stock: 18, isbn: '979889100005', description: 'From first draft to reviewer two: a field guide for authors submitting their first article.' },
  { slug: 'methods-work', title: 'Research Methods That Work', author: 'E. Paulsen', level: 'intermediate', category: 'Research methods', price: 38, stock: 9, isbn: '979889100006', description: 'Designing studies, picking tests and avoiding the usual traps, with worked examples in R and Python.' },
  { slug: 'information-and-entropy', title: 'Information and Entropy', author: 'K. Tanaka', level: 'intermediate', category: 'Information theory', price: 34, stock: 0, isbn: '979889100007', description: 'Bits, codes and channels, building from Shannon’s definitions up to compression and learning.' },
  { slug: 'learning-machines', title: 'Learning Machines', author: 'D. Innovator', level: 'advanced', category: 'Machine learning', price: 42, stock: 12, isbn: '979889100008', description: 'Machine learning from first principles, no hype. Assumes linear algebra and probability.' },
  { slug: 'quantum-questions', title: 'Quantum Questions', author: 'J. Moreno', level: 'advanced', category: 'Physics', price: 46, stock: 5, isbn: '979889100009', description: 'The questions physicists still argue about, with the maths included.' },
  { slug: 'causal-notebook', title: 'The Causal Notebook', author: 'A. Volkov', level: 'advanced', category: 'Statistics', price: 44.5, stock: 7, isbn: '979889100010', description: 'Graphs, interventions and counterfactuals, one worked notebook per chapter.' },
].map((b) => ({ ...b, isbn: isbn13(b.isbn) }))
