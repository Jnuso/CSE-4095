import type { DifficultyLevel, MathOperation, SessionLength } from '../types'

export const OPERATIONS: { value: MathOperation; label: string; symbol: string }[] = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '−' },
  { value: 'multiplication', label: 'Multiplication', symbol: '×' },
  { value: 'division', label: 'Division', symbol: '÷' },
]

export const DIFFICULTIES: { value: DifficultyLevel; label: string; description: string }[] = [
  { value: 1, label: 'Beginner', description: 'Small numbers and early math facts.' },
  { value: 2, label: 'Easy', description: 'Bigger numbers and familiar times tables.' },
  {
    value: 3,
    label: 'Intermediate',
    description: 'Carrying, borrowing, and trickier number facts.',
  },
  { value: 4, label: 'Advanced', description: 'Larger numbers and a bigger challenge.' },
]

export const SESSION_LENGTHS: { value: SessionLength; label: string }[] = [
  { value: 5, label: '5 questions' },
  { value: 10, label: '10 questions' },
  { value: 20, label: '20 questions' },
  { value: 'continuous', label: 'Continuous practice' },
]
