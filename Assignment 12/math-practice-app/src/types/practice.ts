import type { DifficultyLevel, MathOperation } from './question'
import type { ReviewMode, SessionLength } from './session'

export interface PracticeConfiguration {
  reviewMode?: ReviewMode
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
}
