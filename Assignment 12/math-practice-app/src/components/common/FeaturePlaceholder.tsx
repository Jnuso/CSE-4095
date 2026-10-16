import ActionLink from './ActionLink'

interface FeaturePlaceholderProps {
  category: string
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

export default function FeaturePlaceholder({
  category,
  title,
  description,
  actionLabel = 'Back home',
  actionTo = '/',
}: FeaturePlaceholderProps) {
  return (
    <section className="feature-page" aria-labelledby="page-title">
      <div className="feature-card">
        <span className="card-accent" aria-hidden="true">
          ✦
        </span>
        <p className="eyebrow">{category}</p>
        <h1 id="page-title" tabIndex={-1}>
          {title}
        </h1>
        <p className="feature-description">{description}</p>
        <ActionLink to={actionTo}>{actionLabel}</ActionLink>
      </div>
    </section>
  )
}
