import { usePracticeStorage } from './PracticeStorageProvider'

export default function StorageNotice() {
  const { warnings } = usePracticeStorage()
  if (!warnings.length) return null
  return (
    <aside className="storage-notice" role="status" aria-label="Saved data notice">
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </aside>
  )
}
