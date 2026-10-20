import type { DifficultyLevel, MathOperation, QuestionSource } from './question'

export type SessionLength = 5 | 10 | 20 | 'continuous'
export type ReviewMode = 'regular' | 'mistake-review'

export interface PracticeAttempt {
  id: string
  questionId: string
  operation: MathOperation
  firstOperand: number
  secondOperand: number
  correctAnswer: number
  selectedAnswer: number
  selfReportedCorrect: boolean
  difficulty: DifficultyLevel
  mistakePatternId?: string
  source: QuestionSource
  attemptedAt: string
  sessionId: string
}

export interface PracticeSession {
  reviewMode?: ReviewMode
  id: string
  startedAt: string
  completedAt?: string
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
  attempted: number
  correct: number
  incorrect: number
}
