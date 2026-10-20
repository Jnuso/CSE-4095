import { useState } from 'react'
import type { PracticeConfiguration } from '../../types/practice'
import { nextQuestion } from '../../services/practiceSession'
import ErrorMessage from '../common/ErrorMessage'
import QuestionCard from './QuestionCard'

function makePreview(configuration: PracticeConfiguration) {
  try {
    return nextQuestion(configuration, null)
  } catch {
    return null
  }
}

export default function CardPreview({ configuration }: { configuration: PracticeConfiguration }) {
  const [question, setQuestion] = useState(() => makePreview(configuration))
  const [animationEnabled, setAnimationEnabled] = useState(true)
  const [reported, setReported] = useState(false)
  const [focusCard, setFocusCard] = useState(false)

  function newPreview() {
    setQuestion(makePreview(configuration))
    setReported(false)
    setFocusCard(true)
  }

  return (
    <div className="card-preview">
      <h2>Try a question card</h2>
      <p className="preview-note">
        Card preview: try selecting, flipping, and marking an answer. Results are not saved or
        counted yet.
      </p>
      <label className="animation-setting">
        <input
          type="checkbox"
          checked={animationEnabled}
          onChange={(event) => setAnimationEnabled(event.target.checked)}
        />{' '}
        Animate card flips
      </label>
      {question ? (
        <>
          <QuestionCard
            question={question}
            questionNumber={1}
            totalQuestions={
              configuration.sessionLength === 'continuous' ? undefined : configuration.sessionLength
            }
            animationEnabled={animationEnabled}
            focusOnMount={focusCard}
            onResult={() => setReported(true)}
          />
          {reported && (
            <button
              type="button"
              className="button button-secondary preview-next"
              onClick={newPreview}
            >
              Try another card
            </button>
          )}
        </>
      ) : (
        <ErrorMessage onRetry={newPreview}>
          <p>We couldn’t create a question. Please try again.</p>
        </ErrorMessage>
      )}
    </div>
  )
}
