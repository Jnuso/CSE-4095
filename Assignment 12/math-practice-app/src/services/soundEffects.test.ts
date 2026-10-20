import { afterEach, expect, it, vi } from 'vitest'
import { playFlipSound } from './soundEffects'
afterEach(() => vi.unstubAllGlobals())
it('builds a quiet short local tone and closes its audio context', async () => {
  const oscillator = {
    frequency: { value: 0 },
    connect: vi.fn(),
    onended: null as null | (() => void),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const gain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  }
  const close = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal(
    'AudioContext',
    class {
      currentTime = 10
      destination = {}
      resume = vi.fn().mockResolvedValue(undefined)
      close = close
      createOscillator = () => oscillator
      createGain = () => gain
    },
  )
  await playFlipSound()
  expect(oscillator.frequency.value).toBe(523.25)
  expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.04, 10)
  expect(oscillator.stop).toHaveBeenCalledWith(10.09)
  oscillator.onended?.()
  expect(close).toHaveBeenCalledOnce()
})
it('never rejects if browser audio is unsupported', async () => {
  vi.stubGlobal('AudioContext', undefined)
  await expect(playFlipSound()).resolves.toBeUndefined()
})
it('closes and returns normally when the browser blocks audio', async () => {
  const close = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal(
    'AudioContext',
    class {
      resume = () => Promise.reject(new Error('blocked'))
      close = close
    },
  )
  await expect(playFlipSound()).resolves.toBeUndefined()
  expect(close).toHaveBeenCalledOnce()
})
