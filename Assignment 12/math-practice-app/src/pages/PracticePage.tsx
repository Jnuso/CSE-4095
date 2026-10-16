import FeaturePlaceholder from '../components/common/FeaturePlaceholder'

export default function PracticePage() {
  return (
    <FeaturePlaceholder
      category="PRACTICE"
      title="Your practice space"
      description="Math question cards will appear here once a practice session is ready."
      actionLabel="Go to practice setup"
      actionTo="/practice/setup"
    />
  )
}
