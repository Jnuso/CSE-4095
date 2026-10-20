import type { MistakePattern } from '../types/mistake'
import {
  isReviewEvent,
  mergeAttemptEvents,
  isMistakeEvent,
  isMistakePattern,
  type MistakeEvent,
} from './mistakeService'
import { buildReviewedPatterns } from './mistakeReview'
import type { AppSettings } from '../types/settings'
import type { CompletedSession } from './sessionSummary'
import { isCompletedSession } from './sessionSummary'
import { isPracticeConfiguration } from './practiceConfiguration'

export const STORAGE_KEY = 'mathPractice.data'
export const SCHEMA_VERSION = 1
export const MAX_SAVED_SESSIONS = 100
export type StoredSession = CompletedSession // completedAt is optional on its session model.
export interface SavedData {
  version: 1
  settings: AppSettings
  records: StoredSession[]
  reviewEvents?: MistakeEvent[]
  mistakeEvents?: MistakeEvent[]
  mistakePatterns?: MistakePattern[]
  historyResetAt?: number
  appResetAt?: number
}
export interface LoadResult {
  data: SavedData
  warnings: string[]
  canWrite: boolean
}
export type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>
const browserStorage: StorageAccess = () => window.localStorage

export function defaultSettings(): AppSettings {
  return {
    feedbackEnabled: true,
    soundEffectsEnabled: false,
    cardAnimationEnabled: true,
    showExplanations: true,
    defaultSessionLength: 10,
    defaultDifficulty: 1,
    defaultOperations: ['addition'],
    masteryThreshold: 3,
  }
}
export function emptySavedData(): SavedData {
  return { version: SCHEMA_VERSION, settings: defaultSettings(), records: [] }
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
export function isAppSettings(value: unknown): value is AppSettings {
  if (!object(value)) return false
  return (
    (value.feedbackEnabled === undefined || typeof value.feedbackEnabled === 'boolean') &&
    ['soundEffectsEnabled', 'cardAnimationEnabled', 'showExplanations'].every(
      (key) => typeof value[key] === 'boolean',
    ) &&
    isPracticeConfiguration({
      operations: value.defaultOperations,
      difficulty: value.defaultDifficulty,
      sessionLength: value.defaultSessionLength,
    }) &&
    typeof value.masteryThreshold === 'number' &&
    Number.isSafeInteger(value.masteryThreshold) &&
    value.masteryThreshold >= 1 &&
    value.masteryThreshold <= 100
  )
}
export function isStoredSession(value: unknown): value is StoredSession {
  if (!object(value) || !object(value.session)) return false
  // Reuse all attempt/count checks for active snapshots without pretending they are complete.
  const session = value.session
  if (session.completedAt !== undefined) return isCompletedSession(value)
  return isCompletedSession({ ...value, session: { ...session, completedAt: session.startedAt } })
}
// Recover answers independently; cached totals must never decide which answers survive.
function recoverStoredSession(value: unknown): StoredSession | null {
  if (isStoredSession(value)) return value
  if (!object(value) || !object(value.session) || !Array.isArray(value.attempts)) return null
  const session = { ...value.session, attempted: 0, correct: 0, incorrect: 0 }
  if (!isStoredSession({ session, attempts: [] })) return null
  const attempts: StoredSession['attempts'] = []
  const ids = new Set<string>()
  const questions = new Set<string>()
  for (const attempt of value.attempts) {
    if (!object(attempt)) continue
    const correct = Number(attempt.selfReportedCorrect === true)
    const candidate = {
      session: { ...session, attempted: 1, correct, incorrect: 1 - correct },
      attempts: [attempt],
    }
    if (!isStoredSession(candidate)) continue
    const answer = candidate.attempts[0]
    if (ids.has(answer.id) || questions.has(answer.questionId)) continue
    if (
      value.session.sessionLength !== 'continuous' &&
      attempts.length >= (value.session.sessionLength as number)
    )
      break
    ids.add(answer.id)
    questions.add(answer.questionId)
    attempts.push(answer)
  }
  const correct = attempts.filter((attempt) => attempt.selfReportedCorrect).length
  const recovered = {
    session: {
      ...session,
      attempted: attempts.length,
      correct,
      incorrect: attempts.length - correct,
    },
    attempts,
  }
  return isStoredSession(recovered) ? recovered : null
}

function recordDate(record: StoredSession) {
  return Date.parse(
    record.session.completedAt ?? record.attempts.at(-1)?.attemptedAt ?? record.session.startedAt,
  )
}
export function recentRecords(records: readonly StoredSession[]): StoredSession[] {
  const byId = new Map<string, StoredSession>()
  for (const record of records) {
    const existing = byId.get(record.session.id)
    if (
      !existing ||
      record.session.attempted > existing.session.attempted ||
      (record.session.attempted === existing.session.attempted &&
        (!existing.session.completedAt || record.session.completedAt))
    )
      byId.set(record.session.id, record)
  }
  return [...byId.values()]
    .sort((a, b) => recordDate(b) - recordDate(a))
    .slice(0, MAX_SAVED_SESSIONS)
}

export function trackMistakes(data: SavedData): SavedData {
  const fromRecords = data.records.flatMap((record) =>
    record.attempts
      .filter(
        (attempt) =>
          !attempt.selfReportedCorrect ||
          (attempt.source === 'mistake-review' && attempt.mistakePatternId),
      )
      .map((attempt) => ({ attempt, sessionStartedAt: record.session.startedAt })),
  )
  if (
    !data.mistakeEvents &&
    !data.mistakePatterns &&
    !data.reviewEvents &&
    fromRecords.length === 0
  )
    return { ...data, records: recentRecords(data.records) }
  const all = mergeAttemptEvents(
    [...(data.mistakeEvents ?? []), ...(data.reviewEvents ?? []), ...fromRecords],
    data.historyResetAt,
  )
  const reviewEvents = all.filter(isReviewEvent)
  const mistakeEvents = all.filter(
    (e) =>
      !e.attempt.selfReportedCorrect &&
      !(e.attempt.source === 'mistake-review' && e.attempt.mistakePatternId),
  )
  return {
    ...data,
    records: recentRecords(data.records),
    mistakeEvents,
    ...(reviewEvents.length || data.reviewEvents ? { reviewEvents } : {}),
    mistakePatterns: buildReviewedPatterns(
      mistakeEvents,
      reviewEvents,
      data.reviewEvents === undefined ? (data.mistakePatterns ?? []) : [],
      data.settings.masteryThreshold,
    ),
  }
}

// Only these documented legacy layouts are supported; unknown versions are read-only.
function migrate(value: Record<string, unknown>): Record<string, unknown> | null {
  if (value.version === SCHEMA_VERSION) return value
  if (value.version === undefined || value.version === 0) {
    const records = value.records ?? value.sessions
    if (Array.isArray(records) && 'settings' in value)
      return { version: SCHEMA_VERSION, settings: value.settings, records }
  }
  return null
}
export function readSavedData(access: StorageAccess = browserStorage): LoadResult {
  let raw: string | null
  try {
    raw = access().getItem(STORAGE_KEY)
  } catch {
    return {
      data: emptySavedData(),
      warnings: [
        'Browser storage is unavailable. You can keep practicing, but new results may not be saved.',
      ],
      canWrite: false,
    }
  }
  if (raw === null) return { data: emptySavedData(), warnings: [], canWrite: true }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      data: emptySavedData(),
      warnings: [
        'Saved practice data could not be read. Practice can continue without saving; the existing saved data has been left unchanged.',
      ],
      canWrite: false,
    }
  }
  const migrated = object(parsed) ? migrate(parsed) : null
  if (!migrated)
    return {
      data: emptySavedData(),
      warnings: [
        'This saved data format is not supported. Practice can continue without saving; existing data has been left unchanged.',
      ],
      canWrite: false,
    }
  const warnings: string[] = []
  if (object(parsed) && parsed.version !== SCHEMA_VERSION)
    warnings.push('Older saved data was loaded. It will be updated the next time you save.')
  const settings = isAppSettings(migrated.settings) ? migrated.settings : defaultSettings()
  if (!isAppSettings(migrated.settings))
    warnings.push(
      'Saved settings were invalid, so default settings are being used. Your valid session history is still available.',
    )
  const rawRecords = Array.isArray(migrated.records) ? migrated.records : []
  const records = rawRecords.flatMap((value) => {
    const recovered = recoverStoredSession(value)
    return recovered ? [recovered] : []
  })
  if (!Array.isArray(migrated.records) || rawRecords.some((value) => !isStoredSession(value)))
    warnings.push(
      'Some saved session records could not be read. Valid session records and valid answers were kept; damaged answers and totals were repaired.',
    )
  const marker = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined
  const historyResetAt = marker(migrated.historyResetAt)
  const appResetAt = marker(migrated.appResetAt)
  const reviews = Array.isArray(migrated.reviewEvents)
    ? migrated.reviewEvents.filter(isReviewEvent)
    : []
  if (
    migrated.reviewEvents !== undefined &&
    (!Array.isArray(migrated.reviewEvents) || reviews.length !== migrated.reviewEvents.length)
  )
    warnings.push(
      'Some saved review progress could not be read. Valid answers and mistake history are still available.',
    )
  const hasMistakes = migrated.mistakeEvents !== undefined || migrated.mistakePatterns !== undefined
  const events = Array.isArray(migrated.mistakeEvents)
    ? migrated.mistakeEvents.filter(isMistakeEvent)
    : []
  const patterns = Array.isArray(migrated.mistakePatterns)
    ? migrated.mistakePatterns.filter(isMistakePattern)
    : []
  if (
    hasMistakes &&
    (!Array.isArray(migrated.mistakeEvents) ||
      !Array.isArray(migrated.mistakePatterns) ||
      events.length !== migrated.mistakeEvents.length ||
      patterns.length !== migrated.mistakePatterns.length)
  )
    warnings.push(
      'Some saved mistake data could not be read. Tracking was rebuilt from valid saved answers; valid practice history is still available.',
    )
  const data = trackMistakes({
    version: SCHEMA_VERSION,
    settings,
    records: records.filter(
      (record) =>
        historyResetAt === undefined || Date.parse(record.session.startedAt) > historyResetAt,
    ),
    ...(historyResetAt === undefined ? {} : { historyResetAt }),
    ...(appResetAt === undefined ? {} : { appResetAt }),
    ...(hasMistakes ? { mistakeEvents: events, mistakePatterns: patterns } : {}),
    ...(migrated.reviewEvents === undefined ? {} : { reviewEvents: reviews }),
  })
  return { data: { ...data, records: recentRecords(data.records) }, warnings, canWrite: true }
}

export function writeSavedData(
  data: SavedData,
  access: StorageAccess = browserStorage,
): string | null {
  const existing = readSavedData(access)
  if (!existing.canWrite) return existing.warnings.join(' ')
  if (
    data.version !== SCHEMA_VERSION ||
    !isAppSettings(data.settings) ||
    !data.records.every(isStoredSession) ||
    (data.reviewEvents !== undefined && !data.reviewEvents.every(isReviewEvent)) ||
    (data.mistakeEvents !== undefined && !data.mistakeEvents.every(isMistakeEvent)) ||
    (data.mistakePatterns !== undefined && !data.mistakePatterns.every(isMistakePattern))
  )
    return 'Practice data was not saved because it failed validation.'
  try {
    const tracked = trackMistakes(data)
    access().setItem(
      STORAGE_KEY,
      JSON.stringify({ ...tracked, records: recentRecords(tracked.records) }),
    )
    return null
  } catch (error) {
    return error instanceof DOMException && error.name === 'QuotaExceededError'
      ? 'Browser storage is full. You can keep practicing, but the newest changes have not been saved. Existing saved data is unchanged.'
      : 'Browser storage is unavailable. You can keep practicing, but the newest changes have not been saved.'
  }
}
export function latestCompletedSession(data: SavedData): CompletedSession | null {
  return data.records.find((record) => record.session.completedAt !== undefined) ?? null
}

// Used only after explicit clear-all confirmation; may replace an unreadable/unsupported save.
export function clearSavedData(access: StorageAccess = browserStorage): {
  data: SavedData
  error: string | null
} {
  const old = readSavedData(access).data
  const cutoff = Math.max(Date.now(), (old.historyResetAt ?? 0) + 1, (old.appResetAt ?? 0) + 1)
  const data: SavedData = { ...emptySavedData(), historyResetAt: cutoff, appResetAt: cutoff }
  try {
    access().setItem(STORAGE_KEY, JSON.stringify(data))
    return { data, error: null }
  } catch {
    return {
      data,
      error:
        'Application data could not be cleared because browser storage is unavailable or full. Existing saved data is unchanged.',
    }
  }
}
