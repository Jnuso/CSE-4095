export type RandomSource = () => number

export function randomInteger(
  min: number,
  max: number,
  random: RandomSource = Math.random,
): number {
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min > max ||
    !Number.isSafeInteger(max - min + 1)
  ) {
    throw new RangeError('Random integer bounds must define a safe, inclusive integer range.')
  }
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random source must return a number from 0 inclusive to 1 exclusive.')
  }
  return min + Math.floor(value * (max - min + 1))
}

export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInteger(0, index, random)
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}
