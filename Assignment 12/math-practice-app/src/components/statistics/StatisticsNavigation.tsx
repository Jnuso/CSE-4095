import { useEffect, useRef, useState } from 'react'

const sections = [
  ['statistics-title', 'Overview'],
  ['operation-title', 'By operation'],
  ['difficulty-title', 'By difficulty'],
  ['mistake-statistics-title', 'Mistakes and review'],
  ['recent-title', 'Recent sessions'],
  ['reset-title', 'Reset history'],
] as const

export default function StatisticsNavigation() {
  const [active, setActive] = useState<string>('statistics-title')
  const jumpedTo = useRef<number | null>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      // A final section may not reach the top when the document ends first.
      if (jumpedTo.current === window.scrollY) return
      jumpedTo.current = null
      const headings = sections.map(([id]) => document.getElementById(id))
      let current: string = sections[0][0]
      for (const heading of headings) {
        if (heading && heading.getBoundingClientRect().top <= 100) current = heading.id
      }
      setActive(current)
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <nav className="statistics-navigation" aria-label="Statistics sections">
      <p className="eyebrow">ON THIS PAGE</p>
      <ul>
        {sections.map(([id, label]) => (
          <li key={id}>
            <button
              type="button"
              aria-current={active === id ? 'location' : undefined}
              onClick={() => {
                const heading = document.getElementById(id)
                heading?.focus({ preventScroll: true })
                heading?.scrollIntoView({ block: 'start', behavior: 'instant' })
                jumpedTo.current = window.scrollY
                setActive(id)
              }}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
