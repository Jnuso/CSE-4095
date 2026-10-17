import { describe, expect, it } from 'vitest'
import { randomInteger, shuffle } from './random'
import { uniqueId } from './uniqueId'

describe('random utilities', () => {
  it('includes both endpoints and supports single and negative bounds', () => {
    expect(randomInteger(2, 5, () => 0)).toBe(2)
    expect(randomInteger(2, 5, () => 1 - Number.EPSILON)).toBe(5)
    expect(randomInteger(3, 3, () => 0.5)).toBe(3)
    expect(randomInteger(-5, -2, () => 0)).toBe(-5)
  })
  it('rejects invalid bounds and random-source values', () => {
    for (const [min, max] of [
      [5, 2],
      [0.1, 1],
      [0, Infinity],
      [-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    ]) {
      expect(() => randomInteger(min, max)).toThrow(RangeError)
    }
    for (const value of [-1, 1, NaN, Infinity])
      expect(() => randomInteger(0, 2, () => value)).toThrow(RangeError)
  })
  it('shuffles a copy while preserving elements and duplicates', () => {
    const original = Object.freeze([1, 2, 2, 3])
    const result = shuffle(original, () => 0)
    expect(result).not.toEqual(original)
    expect([...result].sort()).toEqual([...original].sort())
    expect(original).toEqual([1, 2, 2, 3])
    expect(shuffle([], () => 0)).toEqual([])
    expect(shuffle([1], () => 0)).toEqual([1])
    expect(shuffle([1, 2, 3], () => 1 - Number.EPSILON)).toEqual([1, 2, 3])
  })
  it('creates distinct UUIDs', () => {
    const ids = Array.from({ length: 1000 }, uniqueId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(
      ids.every((id) =>
        /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(id),
      ),
    ).toBe(true)
  })
})
