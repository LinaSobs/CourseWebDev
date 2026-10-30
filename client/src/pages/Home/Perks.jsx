import Container from '../../shared/Container'

const perks = [
  { title: 'Global shipping', text: '180+ countries, tracked' },
  { title: 'Fair prices', text: 'No surprise fees' },
  { title: 'Easy returns', text: '30 days, no questions' },
  { title: 'Secure ordering', text: 'GDPR ready' },
]

export default function Perks() {
  return (
    <section aria-label="Why GlobalBooks" className="bg-[#d6ecff] text-ink dark:bg-[#14283f]">
      <Container className="flex gap-10 overflow-x-auto py-7 [scrollbar-width:none] md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:py-10 [&::-webkit-scrollbar]:hidden">
        {perks.map((p) => (
          <div key={p.title} className="flex shrink-0 flex-col md:shrink">
            <strong className="t-title">{p.title}</strong>
            <span className="t-body">{p.text}</span>
          </div>
        ))}
      </Container>
    </section>
  )
}
