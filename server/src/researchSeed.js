// Puts the starter content from seed/research.js into the research tables.
// Safe to run again: texts and prices are refreshed, book stock is left alone.
import { transaction } from './db.js'
import { authors, news, papers, books } from '../seed/research.js'

export async function seedResearch() {
  await transaction(async (db) => {
    const authorId = {}
    const getAuthor = async (name, affiliation = '') => {
      if (authorId[name]) return authorId[name]
      const { rows } = await db.query(
        `insert into research.authors (name, affiliation) values ($1, $2)
         on conflict (name) do update set affiliation = case when excluded.affiliation <> '' then excluded.affiliation else research.authors.affiliation end
         returning id`,
        [name, affiliation],
      )
      return (authorId[name] = rows[0].id)
    }

    await db.query('update research.news_articles set is_featured = false') // only one hero story (unique index)
    for (const a of news) {
      const lead = authors[a.lead]
      const leadId = await getAuthor(lead.name, lead.affiliation)
      const { rows } = await db.query(
        `insert into research.news_articles (slug, title, summary, body, hero_image_url, hero_image_alt, author_id, published_at, category, is_featured)
         values ($1,$2,$3,$4,$5,$6,$7, now() - ($8 || ' days')::interval, $9, $10)
         on conflict (slug) do update set title = excluded.title, summary = excluded.summary, body = excluded.body,
           hero_image_url = excluded.hero_image_url, hero_image_alt = excluded.hero_image_alt, author_id = excluded.author_id,
           published_at = excluded.published_at, category = excluded.category, is_featured = excluded.is_featured
         returning id`,
        [a.slug, a.title, a.summary, a.body, `research/${a.image}-1200.webp`, a.alt, leadId, String(a.daysAgo), a.category, !!a.featured],
      )
      await db.query('delete from research.news_article_authors where article_id = $1', [rows[0].id])
      for (const [i, key] of a.authors.entries()) {
        await db.query('insert into research.news_article_authors (article_id, author_id, position) values ($1,$2,$3)', [rows[0].id, await getAuthor(authors[key].name, authors[key].affiliation), i])
      }
    }

    for (const p of papers) {
      const found = await db.query('select id from research.research_papers where title = $1', [p.title])
      let id
      if (found.rowCount) {
        id = found.rows[0].id
        await db.query(
          `update research.research_papers set abstract=$1, doi=$2, publication_date=$3, journal_or_source=$4, difficulty_level=$5, pdf_url=$6 where id=$7`,
          [p.abstract, p.doi, p.date, p.source, p.level, p.pdf, id],
        )
      } else {
        const ins = await db.query(
          `insert into research.research_papers (title, abstract, doi, publication_date, journal_or_source, difficulty_level, pdf_url) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
          [p.title, p.abstract, p.doi, p.date, p.source, p.level, p.pdf],
        )
        id = ins.rows[0].id
      }
      await db.query('delete from research.research_paper_authors where paper_id = $1', [id])
      for (const [i, name] of p.authors.entries()) {
        await db.query('insert into research.research_paper_authors (paper_id, author_id, position) values ($1,$2,$3)', [id, await getAuthor(name), i])
      }
    }

    for (const b of books) {
      await db.query(
        `insert into research.books (slug, title, author, isbn, description, cover_image_url, price, difficulty_level, stock_quantity, category)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (slug) do update set title=excluded.title, author=excluded.author, isbn=excluded.isbn, description=excluded.description,
           cover_image_url=excluded.cover_image_url, price=excluded.price, difficulty_level=excluded.difficulty_level, category=excluded.category`,
        [b.slug, b.title, b.author, b.isbn, b.description, `research/covers/${b.slug}.svg`, b.price, b.level, b.stock, b.category],
      )
    }
  })
  return { news: news.length, papers: papers.length, books: books.length }
}
