import type { DifficultyLevel, MathOperation } from './question'
import type { SessionLength } from './session'

export interface PracticeConfiguration {
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
}
