import { useCatalog } from '../../context/CatalogContext'
import { cover } from '../../lib/asset'
import PageHero, { fanOf } from '../../shared/PageHero/PageHero'
import Button from '../../shared/Button'

// "Stories that are *all yours!*" -> the starred bit gets the accent style
const renderHeadline = (text, accent) =>
  text.split('*').map((part, i) => (i % 2 ? <span key={i} className={accent}>{part}</span> : part))

// A shelf's hero. It is the SAME PageHero as the home page: same video, wash, title size and floating covers.
// Only the words and this group's own covers change.
export default function AudienceHero({ group, theme }) {
  const { books } = useCatalog()
  const fanBooks = books.filter((b) => b.group === group.id).slice(0, 4)
  const gap = fanBooks.length <= 2 ? 130 : 95 // fewer books, wider spread

  return (
    <PageHero
      kicker={group.kicker}
      title={renderHeadline(group.headline, theme.accent)}
      intro={group.intro}
      covers={fanOf(fanBooks.map((b) => cover(b.id)), gap)}
      actions={
        <Button large variant="skin" href="#shelf">
          {group.cta}
        </Button>
      }
    />
  )
}
