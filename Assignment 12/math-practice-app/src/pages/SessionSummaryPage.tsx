import FeaturePlaceholder from '../components/common/FeaturePlaceholder'

export default function SessionSummaryPage() {
  return (
    <FeaturePlaceholder
      category="YOUR RECAP"
      title="Your practice recap"
      description="Finish a practice session to see how you did. There are no session results to show yet."
      actionLabel="Go to practice setup"
      actionTo="/practice/setup"
    />
  )
}
