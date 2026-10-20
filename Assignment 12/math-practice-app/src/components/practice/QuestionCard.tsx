import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { Question } from '../../types/question'
import AnswerChoice from './AnswerChoice'
import { explainQuestion } from '../../services/questionExplanation'
import { playFlipSound } from '../../services/soundEffects'

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
  soundEnabled?: boolean
  showExplanations?: boolean
  focusOnMount?: boolean
  onResult?: (result: CardResult) => void
}

export default function QuestionCard(props: QuestionCardProps) {
  const initialAnnouncement = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    // Later cards are announced by focus on their question heading and progress description.
    // The first card keeps page-title focus, so announce its question after the live region mounts.
    if (initialAnnouncement.current)
      initialAnnouncement.current.textContent = props.focusOnMount
        ? ''
        : `Question ${props.questionNumber}${props.totalQuestions === undefined ? '' : ` of ${props.totalQuestions}`}. ${props.question.displayText}. Tab to the answer choices. Number keys 1 to 4 work while focus is inside the card.`
  }, [
    props.question.id,
    props.question.displayText,
    props.questionNumber,
    props.totalQuestions,
    props.focusOnMount,
  ])
  return (
    <>
      <p
        className="visually-hidden"
        aria-live="polite"
        aria-atomic="true"
        ref={initialAnnouncement}
      />
      <QuestionCardContent key={props.question.id} {...props} />
    </>
  )
}

function QuestionCardContent({
  question,
  questionNumber,
  totalQuestions,
  animationEnabled = true,
  soundEnabled = false,
  showExplanations = true,
  focusOnMount = false,
  onResult,
}: QuestionCardProps) {
  const progressId = useId()
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

  function selectByNumber(event: KeyboardEvent<HTMLElement>) {
    if (
      isCardFlipped ||
      event.defaultPrevented ||
      event.repeat ||
      event.nativeEvent.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !/^[1-4]$/.test(event.key)
    )
      return
    const target = event.target
    if (
      !(target instanceof Element) ||
      target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="spinbutton"]',
      )
    )
      return
    const index = Number(event.key) - 1
    const value = question.choices[index]
    if (value === undefined) return
    event.preventDefault()
    setSelectedAnswer(value)
    event.currentTarget.querySelectorAll<HTMLButtonElement>('.answer-choice')[index]?.focus()
  }

  function report(selfReportedCorrect: boolean) {
    if (!isCardFlipped || selectedAnswer === null || resultLocked.current) return
    resultLocked.current = true
    setReported(selfReportedCorrect)
    onResult?.({ questionId: question.id, selectedAnswer, selfReportedCorrect })
  }

  return (
    <section className="question-card" aria-label="Math question card" onKeyDown={selectByNumber}>
      <p className="question-progress" id={progressId}>
        Question {questionNumber}
        {totalQuestions !== undefined ? ` of ${totalQuestions}` : ''}
      </p>
      <div
        className={`card-face ${isCardFlipped ? 'card-back' : 'card-front'} ${isCardFlipped && animationEnabled ? 'card-flip' : ''} ${!isCardFlipped && focusOnMount && animationEnabled ? 'card-next' : ''}`}
      >
        {isCardFlipped ? (
          <>
            <p className="eyebrow">LET’S CHECK</p>
            <h2
              className="card-math"
              tabIndex={-1}
              ref={answerHeading}
              aria-label={`Correct answer: ${question.correctAnswer}`}
              aria-describedby={progressId}
            >
              {question.displayText.replace('?', String(question.correctAnswer))}
            </h2>
            <p className="student-answer">
              Your answer: <strong>{selectedAnswer}</strong>
            </p>
            {showExplanations && <p className="answer-explanation">{explainQuestion(question)}</p>}
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
            <h2
              className="card-math"
              tabIndex={-1}
              ref={questionHeading}
              aria-describedby={progressId}
            >
              {question.displayText}
            </h2>
            <div className="answer-grid" role="group" aria-label="Answer choices">
              {question.choices.map((value, index) => (
                <AnswerChoice
                  key={value}
                  value={value}
                  shortcut={index + 1}
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
                if (selectedAnswer !== null) {
                  setIsCardFlipped(true)
                  if (soundEnabled) void playFlipSound()
                }
              }}
            >
              Flip Card
            </button>
            <p className="card-hint">Choose, then flip. Focus in card: keys 1–4 select answers.</p>
          </>
        )}
      </div>
    </section>
  )
}
