import { expect, it } from 'vitest'
import { completedFixture } from '../test/summaryFixture'
import {
  emptySavedData,
  trackMistakes,
  writeSavedData,
  readSavedData,
  STORAGE_KEY,
} from './storageService'
import { calculateStatistics } from './statisticsService'

it.each([3000, 6000])(
  'bounds detailed sessions while retaining evidence and review aggregates across %i attempts',
  (count) => {
    const template = completedFixture()
    const records = Array.from({ length: count / 20 }, (_, index) => {
      const id = `large-${index}`
      const startedAt = new Date(Date.UTC(2026, 0, 1) + index * 60000).toISOString()
      const attempts = Array.from({ length: 20 }, (_, n) => ({
        ...template.attempts[0],
        id: `${id}-${n}`,
        questionId: `${id}-q-${n}`,
        sessionId: id,
        firstOperand: index,
        secondOperand: n,
        correctAnswer: index + n,
        selectedAnswer: index + n,
        selfReportedCorrect: false,
        attemptedAt: startedAt,
      }))
      return {
        session: {
          ...template.session,
          id,
          startedAt,
          completedAt: startedAt,
          sessionLength: 'continuous' as const,
          attempted: 20,
          correct: 0,
          incorrect: 20,
        },
        attempts,
      }
    })
    const start = performance.now()
    const data = trackMistakes({ ...emptySavedData(), records })
    const memory = new Map<string, string>()
    const storage = () => ({
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
    })
    expect(writeSavedData(data, storage)).toBeNull()
    const restored = readSavedData(storage)
    expect(restored.warnings).toEqual([])
    expect(restored.data.records).toHaveLength(100)
    expect(calculateStatistics(restored.data.records).attempted).toBe(2000)
    expect(restored.data.mistakeEvents).toHaveLength(count)
    expect(restored.data.mistakePatterns).toHaveLength(count)
    expect(restored.data.mistakePatterns!.reduce((sum, p) => sum + p.incorrectCount, 0)).toBe(count)
    expect(restored.data.mistakePatterns).toEqual(data.mistakePatterns)
    const bytes = memory.get(STORAGE_KEY)!.length * 2
    console.info(
      `Phase 21: ${count} attempts, ${bytes} UTF-16 bytes, ${(performance.now() - start).toFixed(0)}ms track/write/read`,
    )
    // Lossless encoding retains all identities and aggregates within this reference budget.
    expect(bytes).toBeLessThan(5 * 1024 * 1024)
    expect(bytes).toBeLessThan(JSON.stringify(data).length * 2)
    expect(JSON.parse(memory.get(STORAGE_KEY)!).version).toBe(2)
    const before = memory.get(STORAGE_KEY)
    const quotaStorage = () => ({
      getItem: storage().getItem,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError')
      },
    })
    expect(writeSavedData(restored.data, quotaStorage)).toContain(
      'Existing saved data is unchanged',
    )
    expect(memory.get(STORAGE_KEY)).toBe(before)
  },
)
