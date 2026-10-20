import type { Question } from '../types/question'
export function explainQuestion(question: Question): string {
  const { firstOperand: a, secondOperand: b, correctAnswer: answer } = question
  switch (question.operation) {
    case 'addition':
      return `${a} plus ${b} makes ${answer}.`
    case 'subtraction':
      return `${a} take away ${b} leaves ${answer}.`
    case 'multiplication':
      return `${a} groups of ${b} make ${answer}.`
    case 'division':
      return `${a} shared into ${b} equal groups gives ${answer} in each group.`
  }
}
