import { DIFFICULTIES, OPERATIONS, SESSION_LENGTHS } from '../constants/practice'
import type { PracticeConfiguration } from '../types'

export function isPracticeConfiguration(value: unknown): value is PracticeConfiguration {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  const operations = candidate.operations
  return (
    Array.isArray(operations) &&
    operations.length > 0 &&
    operations.length <= OPERATIONS.length &&
    new Set(operations).size === operations.length &&
    operations.every((value) => OPERATIONS.some((option) => option.value === value)) &&
    DIFFICULTIES.some((option) => option.value === candidate.difficulty) &&
    SESSION_LENGTHS.some((option) => option.value === candidate.sessionLength)
  )
}

export function configurationFromState(state: unknown): PracticeConfiguration | null {
  if (typeof state !== 'object' || state === null || !('practiceConfig' in state)) return null
  return isPracticeConfiguration(state.practiceConfig) ? state.practiceConfig : null
}
