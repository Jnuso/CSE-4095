import { expect, it } from 'vitest'
import { chooseFeedback } from './practiceFeedback'
import { emptySavedData, isAppSettings } from './storageService'

it('varies supportive feedback for each self-reported outcome', () => {
  for (const right of [true, false]) {
    const messages = [0, 0.4, 0.99].map((value) => chooseFeedback(right, () => value))
    expect(new Set(messages).size).toBe(3)
  }
  expect(chooseFeedback(false, () => 0)).toContain('Keep practicing')
})

it('accepts legacy preferences and validates the optional feedback toggle', () => {
  const settings = emptySavedData().settings
  delete settings.feedbackEnabled
  expect(isAppSettings(settings)).toBe(true)
  expect(isAppSettings({ ...settings, feedbackEnabled: false })).toBe(true)
  expect(isAppSettings({ ...settings, feedbackEnabled: 'false' })).toBe(false)
})
