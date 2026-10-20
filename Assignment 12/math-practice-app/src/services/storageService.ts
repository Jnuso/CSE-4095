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
  historyResetAt?: number
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
  if (!migrated || !Array.isArray(migrated.records))
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
  const records = migrated.records.filter(isStoredSession)
  if (records.length !== migrated.records.length)
    warnings.push(
      'Some saved session records could not be read. Valid session records are still available.',
    )
  return {
    data: {
      version: SCHEMA_VERSION,
      settings,
      records: recentRecords(records).filter(
        (record) =>
          typeof migrated.historyResetAt !== 'number' ||
          !Number.isSafeInteger(migrated.historyResetAt) ||
          migrated.historyResetAt < 0 ||
          Date.parse(record.session.startedAt) > migrated.historyResetAt,
      ),
      ...(typeof migrated.historyResetAt === 'number' &&
      Number.isSafeInteger(migrated.historyResetAt) &&
      migrated.historyResetAt >= 0
        ? { historyResetAt: migrated.historyResetAt }
        : {}),
    },
    warnings,
    canWrite: true,
  }
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
    !data.records.every(isStoredSession)
  )
    return 'Practice data was not saved because it failed validation.'
  try {
    access().setItem(STORAGE_KEY, JSON.stringify({ ...data, records: recentRecords(data.records) }))
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
