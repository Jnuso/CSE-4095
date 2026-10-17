import { useEffect, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import AnswerChoice from './AnswerChoice'

export interface CardResult {
  questionId: string
  selectedAnswer: number
  selfReportedCorrect: boolean
}

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions?: number
  animationEnabled?: boolean
  focusOnMount?: boolean
  onResult?: (result: CardResult) => void
}

export default function QuestionCard(props: QuestionCardProps) {
  // A new question ID creates fresh state before the new question is painted.
  return <QuestionCardContent key={props.question.id} {...props} />
}

function QuestionCardContent({
  question,
  questionNumber,
  totalQuestions,
  animationEnabled = true,
  focusOnMount = false,
  onResult,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [reported, setReported] = useState<boolean | null>(null)
  const resultLocked = useRef(false)
  const answerHeading = useRef<HTMLHeadingElement>(null)
  const questionHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusOnMount) questionHeading.current?.focus()
  }, [focusOnMount])

  useEffect(() => {
    if (isCardFlipped) answerHeading.current?.focus()
  }, [isCardFlipped])

  function report(selfReportedCorrect: boolean) {
    if (!isCardFlipped || selectedAnswer === null || resultLocked.current) return
    resultLocked.current = true
    setReported(selfReportedCorrect)
    onResult?.({ questionId: question.id, selectedAnswer, selfReportedCorrect })
  }

  return (
    <section className="question-card" aria-label="Math question card">
      <p className="question-progress">
        Question {questionNumber}
        {totalQuestions !== undefined ? ` of ${totalQuestions}` : ''}
      </p>
      <div
        className={`card-face ${isCardFlipped ? 'card-back' : 'card-front'} ${isCardFlipped && animationEnabled ? 'card-flip' : ''}`}
      >
        {isCardFlipped ? (
          <>
            <p className="eyebrow">LET’S CHECK</p>
            <h2
              className="card-math"
              tabIndex={-1}
              ref={answerHeading}
              aria-label={`Correct answer: ${question.correctAnswer}`}
            >
              {question.displayText.replace('?', String(question.correctAnswer))}
            </h2>
            <p className="student-answer">
              Your answer: <strong>{selectedAnswer}</strong>
            </p>
            <p>How did you do?</p>
            <div className="card-actions">
              <button
                type="button"
                className="button button-primary"
                disabled={reported !== null}
                aria-pressed={reported === true}
                onClick={() => report(true)}
              >
                I Got It Right
              </button>
              <button
                type="button"
                className="button button-secondary"
                disabled={reported !== null}
                aria-pressed={reported === false}
                onClick={() => report(false)}
              >
                I Got It Wrong
              </button>
            </div>
            <p className="card-status" role="status">
              {reported === null ? '' : `You marked this ${reported ? 'right' : 'wrong'}.`}
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">PICK YOUR ANSWER</p>
            <h2 className="card-math" tabIndex={-1} ref={questionHeading}>
              {question.displayText}
            </h2>
            <div className="answer-grid" role="group" aria-label="Answer choices">
              {question.choices.map((value) => (
                <AnswerChoice
                  key={value}
                  value={value}
                  selected={selectedAnswer === value}
                  onSelect={(value) => {
                    if (!isCardFlipped) setSelectedAnswer(value)
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className="button button-primary flip-button"
              disabled={selectedAnswer === null}
              onClick={() => {
                if (selectedAnswer !== null) setIsCardFlipped(true)
              }}
            >
              Flip Card
            </button>
            <p className="card-hint">Choose an answer, then flip to check it.</p>
          </>
        )}
      </div>
    </section>
  )
}
