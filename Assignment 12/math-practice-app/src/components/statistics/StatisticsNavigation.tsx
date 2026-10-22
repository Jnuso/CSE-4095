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
  const jumpedTo = useRef<string | null>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      // A bottom-clamped target can remain below the top. Scroll anchoring/layout changes
      // must not replace the user's chosen section merely because scrollY changed.
      const pinned = jumpedTo.current && document.getElementById(jumpedTo.current)
      if (pinned) {
        const top = pinned.getBoundingClientRect().top
        if (top >= -1 && top < window.innerHeight) return
      }
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
    const release = () => {
      jumpedTo.current = null
      schedule()
    }
    const keyboardScroll = (event: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key) &&
        !(
          event.target instanceof Element &&
          event.target.closest('input, textarea, select, [contenteditable="true"]')
        )
      )
        release()
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('touchmove', release, { passive: true })
    window.addEventListener('pointerdown', release, { passive: true })
    window.addEventListener('keydown', keyboardScroll)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchmove', release)
      window.removeEventListener('pointerdown', release)
      window.removeEventListener('keydown', keyboardScroll)
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
                jumpedTo.current = id
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
