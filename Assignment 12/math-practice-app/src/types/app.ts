import type { MistakePattern } from './mistake'
import type { Question } from './question'
import type { PracticeAttempt, PracticeSession } from './session'
import type { AppSettings } from './settings'
import type { AppStatistics } from './statistics'

export interface AppState {
  settings: AppSettings
  currentSession: PracticeSession | null
  currentQuestion: Question | null
  currentQuestionIndex: number
  selectedAnswer: number | null
  isCardFlipped: boolean
  attempts: PracticeAttempt[]
  mistakePatterns: MistakePattern[]
  statistics: AppStatistics
}
