import Container from '../../shared/Container'

// three short promises, worded the way this group likes to be spoken to
export default function Points({ group, theme }) {
  return (
    <section aria-label={`Why ${group.title} readers shop here`} className={`${theme.font} ${theme.pointsBg}`}>
      <Container className="grid gap-6 py-8 md:grid-cols-3 md:gap-10 md:py-12">
        {group.points.map((p) => (
          <div key={p.title}>
            <h3 className={theme.pointTitle}>{p.title}</h3>
            <p className={`mt-1 ${theme.pointText}`}>{p.text}</p>
          </div>
        ))}
      </Container>
    </section>
  )
}
