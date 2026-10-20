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
  writeSavedData,
  recentRecords,
  STORAGE_KEY,
  type SavedData,
  type StoredSession,
} from '../../services/storageService'

interface StorageContextValue {
  data: SavedData
  warnings: string[]
  saveSettings: (patch: Partial<AppSettings>) => void
  saveSession: (record: StoredSession) => void
  resetHistory: () => string | null
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
      // Keep unsaved attempts in memory when another tab updates storage.
      const next = {
        ...disk,
        data: !disk.canWrite
          ? latest.current.data
          : {
              ...disk.data,
              records: recentRecords([
                ...disk.data.records,
                ...(disk.data.historyResetAt === latest.current.data.historyResetAt
                  ? latest.current.data.records
                  : []),
              ]),
            },
      }
      latest.current = next
      setLoaded(next)
    }
    window.addEventListener('storage', reload)
    return () => window.removeEventListener('storage', reload)
  }, [])

  const commit = useCallback((patch: Partial<AppSettings>, record?: StoredSession) => {
    pendingSettings.current = { ...pendingSettings.current, ...patch }
    const disk = readSavedData()
    const memory = latest.current
    const data: SavedData = {
      version: 1,
      historyResetAt: disk.data.historyResetAt ?? memory.data.historyResetAt,
      settings: {
        ...(disk.canWrite ? disk.data.settings : memory.data.settings),
        ...pendingSettings.current,
      },
      records: recentRecords([
        ...disk.data.records,
        ...(!disk.canWrite || disk.data.historyResetAt === memory.data.historyResetAt
          ? memory.data.records
          : []),
        ...(record &&
        Date.parse(record.session.startedAt) >
          (disk.data.historyResetAt ?? memory.data.historyResetAt ?? 0)
          ? [record]
          : []),
      ]),
    }
    const error = disk.canWrite ? writeSavedData(data) : null
    if (disk.canWrite && !error) pendingSettings.current = {}
    const next = {
      data,
      canWrite: disk.canWrite,
      warnings: [...new Set([...disk.warnings, ...(error ? [error] : [])])],
    }
    latest.current = next
    setLoaded(next)
  }, [])
  const saveSettings = useCallback((patch: Partial<AppSettings>) => commit(patch), [commit])
  const saveSession = useCallback((record: StoredSession) => commit({}, record), [commit])

  const resetHistory = useCallback((): string | null => {
    const disk = readSavedData()
    if (!disk.canWrite)
      return 'History could not be reset because browser storage is unavailable or protected.'
    const data: SavedData = {
      version: 1,
      settings: { ...disk.data.settings, ...pendingSettings.current },
      records: [],
      historyResetAt: Math.max(Date.now(), (disk.data.historyResetAt ?? 0) + 1),
    }
    const error = writeSavedData(data)
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
