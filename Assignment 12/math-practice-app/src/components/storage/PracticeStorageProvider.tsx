import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppSettings } from '../../types/settings'
import {
  readSavedData,
  trackMistakes,
  clearSavedData,
  isAppSettings,
  writeSavedData,
  STORAGE_KEY,
  type SavedData,
  type StoredSession,
} from '../../services/storageService'

interface StorageContextValue {
  data: SavedData
  warnings: string[]
  saveSettings: (patch: Partial<AppSettings>) => string | null
  saveSession: (record: StoredSession) => void
  resetHistory: () => string | null
  clearAllData: () => string | null
}
const StorageContext = createContext<StorageContextValue | null>(null)

export default function PracticeStorageProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(() => readSavedData())
  const latest = useRef(loaded)
  const pendingSettings = useRef<Partial<AppSettings>>({})

  useEffect(() => {
    function reload(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return
      const disk = readSavedData()
      if (disk.canWrite && disk.data.appResetAt !== latest.current.data.appResetAt)
        pendingSettings.current = {}
      // Keep unsaved attempts in memory when another tab updates storage.
      const next = {
        ...disk,
        data: !disk.canWrite
          ? latest.current.data
          : trackMistakes({
              ...disk.data,
              mistakeEvents: [
                ...(disk.data.mistakeEvents ?? []),
                ...(disk.data.historyResetAt === latest.current.data.historyResetAt
                  ? (latest.current.data.mistakeEvents ?? [])
                  : []),
              ],
              records: [
                ...disk.data.records,
                ...(disk.data.historyResetAt === latest.current.data.historyResetAt
                  ? latest.current.data.records
                  : []),
              ],
            }),
      }
      latest.current = next
      setLoaded(next)
    }
    window.addEventListener('storage', reload)
    return () => window.removeEventListener('storage', reload)
  }, [])

  const commit = useCallback((patch: Partial<AppSettings>, record?: StoredSession) => {
    const disk = readSavedData()
    const memory = latest.current
    if (disk.canWrite && disk.data.appResetAt !== memory.data.appResetAt)
      pendingSettings.current = {}
    pendingSettings.current = { ...pendingSettings.current, ...patch }
    const data: SavedData = trackMistakes({
      version: 1,
      historyResetAt: disk.data.historyResetAt ?? memory.data.historyResetAt,
      appResetAt: disk.data.appResetAt ?? memory.data.appResetAt,
      mistakeEvents: [
        ...(disk.data.mistakeEvents ?? []),
        ...(!disk.canWrite || disk.data.historyResetAt === memory.data.historyResetAt
          ? (memory.data.mistakeEvents ?? [])
          : []),
      ],
      mistakePatterns: [
        ...(memory.data.mistakePatterns ?? []),
        ...(disk.data.mistakePatterns ?? []),
      ],
      settings: {
        ...(disk.canWrite ? disk.data.settings : memory.data.settings),
        ...pendingSettings.current,
      },
      records: [
        ...disk.data.records,
        ...(!disk.canWrite || disk.data.historyResetAt === memory.data.historyResetAt
          ? memory.data.records
          : []),
        ...(record &&
        Date.parse(record.session.startedAt) >
          (disk.data.historyResetAt ?? memory.data.historyResetAt ?? 0)
          ? [record]
          : []),
      ],
    })
    if (!isAppSettings(data.settings))
      return 'Choose at least one operation and valid practice options before saving.'
    const error = disk.canWrite ? writeSavedData(data) : null
    if (disk.canWrite && !error) pendingSettings.current = {}
    const next = {
      data,
      canWrite: disk.canWrite,
      warnings: [...new Set([...disk.warnings, ...(error ? [error] : [])])],
    }
    latest.current = next
    setLoaded(next)
    return error ?? (disk.canWrite ? null : disk.warnings.join(' '))
  }, [])
  const saveSettings = useCallback((patch: Partial<AppSettings>) => commit(patch), [commit])
  const saveSession = useCallback((record: StoredSession) => commit({}, record), [commit])

  const resetHistory = useCallback((): string | null => {
    const disk = readSavedData()
    if (!disk.canWrite)
      return 'History could not be reset because browser storage is unavailable or protected.'
    if (disk.data.appResetAt !== latest.current.data.appResetAt) pendingSettings.current = {}
    const data: SavedData = {
      version: 1,
      settings: { ...disk.data.settings, ...pendingSettings.current },
      records: [],
      historyResetAt: Math.max(Date.now(), (disk.data.historyResetAt ?? 0) + 1),
      appResetAt: disk.data.appResetAt,
    }
    const error = writeSavedData(data)
    if (error) return error
    pendingSettings.current = {}
    const next = { data, canWrite: true, warnings: [] }
    latest.current = next
    setLoaded(next)
    return null
  }, [])

  const clearAllData = useCallback((): string | null => {
    const { data, error } = clearSavedData()
    if (error) return error
    pendingSettings.current = {}
    const next = { data, canWrite: true, warnings: [] }
    latest.current = next
    setLoaded(next)
    return null
  }, [])

  return (
    <StorageContext
      value={{
        data: loaded.data,
        warnings: loaded.warnings,
        saveSettings,
        saveSession,
        resetHistory,
        clearAllData,
      }}
    >
      {children}
    </StorageContext>
  )
}

// Kept beside the provider so consumers share the same context.
// eslint-disable-next-line react-refresh/only-export-components
export function usePracticeStorage() {
  const value = useContext(StorageContext)
  if (!value) throw new Error('Practice storage provider is required.')
  return value
}
