import ErrorMessage from '../common/ErrorMessage'
import { usePracticeStorage } from './PracticeStorageProvider'

export default function StorageNotice() {
  const { warnings } = usePracticeStorage()
  if (!warnings.length) return null
  return (
    <ErrorMessage className="storage-notice" role="status" label="Saved data notice">
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </ErrorMessage>
  )
}
