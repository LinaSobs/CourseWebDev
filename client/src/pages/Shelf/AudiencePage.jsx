import { themes } from '../../data/themes'
import AudienceHero from './AudienceHero'
import Points from './Points'
import KidsCategories from './KidsCategories'
import Shelf from './Shelf'
import OtherShelves from './OtherShelves'
import useCategory, { setCategory, pickCategory } from '../../lib/useCategory'

// One reader group's page. Everything in it takes its look from that group's theme.
// The chosen section lives in the address bar (see useCategory), because three things change it:
// the section drop-down in the header, the big tiles (Kids Corner only) and the chips inside the shelf.
export default function AudiencePage({ group }) {
  const theme = themes[group.id]
  const picked = useCategory()
  // ignore a ?cat= that this shelf doesn't have (an old link, or one typed by hand)
  const category = group.categories.some((c) => c.id === picked) ? picked : 'all'

  return (
    <>
      <AudienceHero group={group} theme={theme} />
      <Points group={group} theme={theme} />
      {group.world === 'kids' && <KidsCategories group={group} onPick={pickCategory} />}
      <Shelf group={group} theme={theme} category={category} onCategory={setCategory} />
      <OtherShelves current={group.id} />
    </>
  )
}
