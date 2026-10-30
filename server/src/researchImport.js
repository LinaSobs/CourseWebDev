// Pulls REAL content from free public APIs (no account or API key needed) into the research tables.
//   news   <- Spaceflight News API   https://api.spaceflightnewsapi.net/v4/articles   (space and science news, with pictures)
//   papers <- OpenAlex               https://api.openalex.org/works                    (open-access research papers with PDF links)
// Running it twice is safe: stories are matched by their link, papers by DOI (or title), so nothing is duplicated.
import { query, transaction } from './db.js'

const get = async (url) => {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'GlobalBooks-student-project' }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${url} answered ${res.status}`)
  return res.json()
}
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

// ------------------------------------------------------------------ news
export function parseNews(json) {
  return (json.results ?? [])
    .filter((a) => a.title && a.url && a.summary && a.image_url?.startsWith('https://'))
    .map((a) => ({
      title: clip(a.title, 200),
      summary: clip(a.summary, 400),
      body: `${a.summary}\n\nThis story was first published by ${a.news_site}. Use the button above to read the full article there.`,
      image: a.image_url,
      publishedAt: a.published_at,
      sourceUrl: a.url,
      sourceName: a.news_site,
      authors: (a.authors ?? []).map((x) => x.name).filter(Boolean).slice(0, 3),
    }))
}

export async function importNews(limit = 15) {
  const items = parseNews(await get(`https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}&ordering=-published_at`))
  let added = 0
  await transaction(async (db) => {
    for (const a of items) {
      const names = a.authors.length ? a.authors : [a.sourceName]
      const ids = []
      for (const name of names) {
        const r = await db.query(`insert into research.authors (name, affiliation) values ($1, $2) on conflict (name) do update set name = excluded.name returning id`, [name, a.sourceName])
        ids.push(r.rows[0].id)
      }
      const slug = `${a.sourceUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 80)}`
      const r = await db.query(
        `insert into research.news_articles (slug, title, summary, body, hero_image_url, hero_image_alt, author_id, published_at, category, is_featured, source_url, source_name)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'Space & science', false, $9, $10)
         on conflict (source_url) where source_url is not null do nothing
         returning id`,
        [slug, a.title, a.summary, a.body, a.image, a.title, ids[0], a.publishedAt, a.sourceUrl, a.sourceName],
      )
      if (r.rowCount) {
        added++
        for (const [i, id] of ids.entries()) await db.query('insert into research.news_article_authors (article_id, author_id, position) values ($1,$2,$3) on conflict do nothing', [r.rows[0].id, id, i])
      }
    }
  })
  return { fetched: items.length, added }
}

// ------------------------------------------------------------------ papers
// OpenAlex does not know our difficulty levels, so each search below carries the level we want for its results.
const TOPICS = [
  { q: 'reproducibility crisis in science', level: 'beginner' },
  { q: 'introduction to machine learning', level: 'beginner' },
  { q: 'convolutional neural networks image recognition', level: 'intermediate' },
  { q: 'statistical learning methods', level: 'intermediate' },
  { q: 'large language models transformer', level: 'advanced' },
  { q: 'causal inference', level: 'advanced' },
]

// OpenAlex stores abstracts as {word: [positions]}. This puts the words back in order.
export function abstractFrom(index) {
  if (!index) return ''
  const words = []
  for (const [word, positions] of Object.entries(index)) for (const p of positions) words[p] = word
  return words.filter(Boolean).join(' ')
}

export function parsePapers(json, level) {
  return (json.results ?? [])
    .map((w) => ({
      title: clip(w.title ?? '', 300),
      abstract: clip(abstractFrom(w.abstract_inverted_index), 900),
      doi: w.doi ? w.doi.replace('https://doi.org/', '') : null,
      date: w.publication_date,
      source: w.primary_location?.source?.display_name ?? 'Open access',
      pdf: w.best_oa_location?.pdf_url ?? w.open_access?.oa_url ?? null,
      level,
      authors: (w.authorships ?? []).map((a) => a.author?.display_name).filter(Boolean).slice(0, 12),
    }))
    .filter((p) => p.title && p.abstract.length > 60 && p.pdf?.startsWith('http') && p.date && p.authors.length)
}

export async function importPapers(perTopic = 4) {
  const mail = process.env.CONTACT_EMAIL ? `&mailto=${encodeURIComponent(process.env.CONTACT_EMAIL)}` : ''
  let added = 0
  let fetched = 0
  for (const t of TOPICS) {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(t.q)}&filter=open_access.is_oa:true,has_abstract:true,type:article&sort=cited_by_count:desc&per-page=${perTopic * 2}${mail}`
    const papers = parsePapers(await get(url), t.level).slice(0, perTopic)
    fetched += papers.length
    await transaction(async (db) => {
      for (const p of papers) {
        const dup = await db.query('select 1 from research.research_papers where (doi is not null and doi = $1) or title = $2', [p.doi, p.title])
        if (dup.rowCount) continue
        const ins = await db.query(
          `insert into research.research_papers (title, abstract, doi, publication_date, journal_or_source, difficulty_level, pdf_url) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
          [p.title, p.abstract, p.doi, p.date, p.source, p.level, p.pdf],
        )
        added++
        for (const [i, name] of p.authors.entries()) {
          const a = await db.query(`insert into research.authors (name) values ($1) on conflict (name) do update set name = excluded.name returning id`, [name])
          await db.query('insert into research.research_paper_authors (paper_id, author_id, position) values ($1,$2,$3) on conflict do nothing', [ins.rows[0].id, a.rows[0].id, i])
        }
      }
    })
  }
  return { fetched, added }
}

// used by the server's automatic refresh: never throws, just reports
export async function refreshFromApis({ news = true, papers = false } = {}) {
  const out = {}
  if (news) out.news = await importNews().catch((e) => ({ error: e.message }))
  if (papers) out.papers = await importPapers().catch((e) => ({ error: e.message }))
  return out
}

export const countRows = async () => {
  const { rows } = await query(`select (select count(*) from research.news_articles)::int as news, (select count(*) from research.research_papers)::int as papers, (select count(*) from research.books)::int as books`)
  return rows[0]
}
