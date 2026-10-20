import { completedFixture } from './summaryFixture'
import type { MistakeEvent } from '../services/mistakeService'
export function mistakeEvent(id = 'miss-1', at = '2026-10-18T12:02:00.000Z'): MistakeEvent {
  const record = completedFixture()
  return {
    sessionStartedAt: record.session.startedAt,
    attempt: { ...record.attempts[1], id, questionId: `question-${id}`, attemptedAt: at },
  }
}
