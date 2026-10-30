// Centers content and keeps it off the screen edges (same job as .container before).
export default function Container({ as: Tag = 'div', className = '', children }) {
  return (
    <Tag className={`mx-auto w-full max-w-[calc(1180px_+_2*var(--gutter))] px-[var(--gutter)] ${className}`}>
      {children}
    </Tag>
  )
}
