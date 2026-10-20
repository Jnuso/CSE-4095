import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Question } from '../../types/question'
import AnswerChoice from './AnswerChoice'
import QuestionCard from './QuestionCard'
import CardPreview from './CardPreview'
import * as sounds from '../../services/soundEffects'

const question: Question = {
  id: 'card-1',
  operation: 'multiplication',
  firstOperand: 7,
  secondOperand: 8,
  displayText: '7 × 8 = ?',
  correctAnswer: 56,
  choices: [48, 54, 56, 64],
  difficulty: 2,
  source: 'regular',
}

describe('question card', () => {
  it('shows the question, four choices and progress without revealing the answer', () => {
    render(<QuestionCard question={question} questionNumber={3} totalQuestions={10} />)
    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '7 × 8 = ?' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole('button'),
    ).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    expect(screen.queryByText('Your answer:')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'I Got It Right' })).not.toBeInTheDocument()
  })
  it('allows switching answers before flipping and only then enables flip', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={question} questionNumber={1} />)
    await user.click(screen.getByRole('button', { name: 'Answer 48' }))
    expect(screen.getByRole('button', { name: 'Answer 48' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Answer 56' }))
    expect(screen.getByRole('button', { name: 'Answer 48' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Answer 56' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeEnabled()
  })
  it('reveals original math, correct and selected answers, and locks answer changes', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={question} questionNumber={1} />)
    await user.click(screen.getByRole('button', { name: 'Answer 48' }))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByRole('heading', { name: 'Correct answer: 56' })).toHaveTextContent(
      '7 × 8 = 56',
    )
    expect(screen.getByRole('heading', { name: 'Correct answer: 56' })).toHaveFocus()
    expect(screen.getByText('Your answer:').parentElement).toHaveTextContent('48')
    expect(screen.queryByRole('group', { name: 'Answer choices' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Flip Card' })).not.toBeInTheDocument()
  })
  it.each([true, false])(
    'reports self-assessment %s once, independently of selected correctness',
    async (reported) => {
      const user = userEvent.setup()
      const onResult = vi.fn()
      render(<QuestionCard question={question} questionNumber={1} onResult={onResult} />)
      await user.click(screen.getByRole('button', { name: 'Answer 48' }))
      expect(onResult).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      expect(onResult).not.toHaveBeenCalled()
      const right = screen.getByRole('button', { name: 'I Got It Right' })
      const wrong = screen.getByRole('button', { name: 'I Got It Wrong' })
      fireEvent.click(reported ? right : wrong)
      fireEvent.click(reported ? wrong : right)
      expect(onResult).toHaveBeenCalledExactlyOnceWith({
        questionId: 'card-1',
        selectedAnswer: 48,
        selfReportedCorrect: reported,
      })
      expect(right).toBeDisabled()
      expect(wrong).toBeDisabled()
      expect(screen.getByRole('status')).toHaveTextContent(
        `You marked this ${reported ? 'right' : 'wrong'}.`,
      )
    },
  )
  it('resets selection, flip and result state for a new question ID', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <QuestionCard question={question} questionNumber={1} totalQuestions={5} />,
    )
    await user.click(screen.getByRole('button', { name: 'Answer 56' }))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    rerender(
      <QuestionCard
        question={{ ...question, id: 'card-2' }}
        questionNumber={2}
        totalQuestions={5}
      />,
    )
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    for (const button of within(screen.getByRole('group')).getAllByRole('button'))
      expect(button).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Answer 54' }))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByRole('button', { name: 'I Got It Wrong' })).toBeEnabled()
  })
  it('supports keyboard selection, flipping, and self-report without animation', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={question} questionNumber={1} animationEnabled={false} />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Answer 48' })).toHaveFocus()
    await user.keyboard(' ')
    for (let index = 0; index < 4; index += 1) await user.tab()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('heading', { name: 'Correct answer: 56' }).parentElement,
    ).not.toHaveClass('card-flip')
    await user.tab()
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByRole('status')).toHaveTextContent('right')
  })
  it('omits a fixed total for continuous practice', () => {
    render(<QuestionCard question={question} questionNumber={4} />)
    expect(screen.getByText('Question 4')).toBeInTheDocument()
    expect(screen.queryByText(/Question 4 of/)).not.toBeInTheDocument()
  })
  it('enables animation only when allowed', async () => {
    const user = userEvent.setup()
    render(<QuestionCard question={question} questionNumber={1} />)
    await user.click(screen.getByRole('button', { name: 'Answer 56' }))
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByRole('heading', { name: 'Correct answer: 56' }).parentElement).toHaveClass(
      'card-flip',
    )
  })
  it('keeps a disabled answer button inactive', async () => {
    const onSelect = vi.fn()
    render(<AnswerChoice value={0} selected disabled onSelect={onSelect} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Answer 0' }))
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('card preview', () => {
  it('offers animation control and a fresh card after self-report, without counting a session', async () => {
    const user = userEvent.setup()
    render(
      <CardPreview configuration={{ operations: ['addition'], difficulty: 1, sessionLength: 5 }} />,
    )
    expect(screen.getByText(/Results are not saved or counted yet/)).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Animate card flips' }))
    await user.click(within(screen.getByRole('group')).getAllByRole('button')[0])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByRole('heading', { name: /Correct answer/ }).parentElement).not.toHaveClass(
      'card-flip',
    )
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    await user.click(screen.getByRole('button', { name: 'Try another card' }))
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /= \?/ })).toHaveFocus()
    expect(screen.getByRole('checkbox', { name: 'Animate card flips' })).not.toBeChecked()
  })
})

it.each([true, false])('honors explanation and sound preferences (%s)', async (enabled) => {
  const play = vi.spyOn(sounds, 'playFlipSound').mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(
    <QuestionCard
      question={question}
      questionNumber={1}
      showExplanations={enabled}
      soundEnabled={enabled}
    />,
  )
  expect(screen.queryByText('7 groups of 8 make 56.')).not.toBeInTheDocument()
  expect(play).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Answer 48' }))
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  if (enabled) expect(screen.getByText('7 groups of 8 make 56.')).toBeInTheDocument()
  else expect(screen.queryByText('7 groups of 8 make 56.')).not.toBeInTheDocument()
  expect(play).toHaveBeenCalledTimes(enabled ? 1 : 0)
})
