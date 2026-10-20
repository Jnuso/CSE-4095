import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MistakeStatistics from '../components/statistics/MistakeStatistics'
import { emptySavedData, trackMistakes } from '../services/storageService'
import { mistakeStatisticsFixture, wrongFact } from '../test/mistakeStatisticsFixture'

describe('mistake statistics views', () => {
  it('shows zero totals and distinct empty active/mastered explanations', () => {
    render(<MistakeStatistics data={emptySavedData()} />)
    expect(screen.getByText(/No remembered mistakes yet/)).toBeInTheDocument()
    expect(screen.getByText(/No active mistakes to strengthen/)).toBeInTheDocument()
    expect(screen.queryByText('Most frequently missed operation')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Mastered mistakes (0)' }))
    expect(screen.getByText(/No mastered patterns yet/)).toBeInTheDocument()
  })
  it('shows totals, original-operation frequency, active details and mastered progress separately', () => {
    const data = mistakeStatisticsFixture()
    const before = JSON.stringify(data)
    render(<MistakeStatistics data={data} />)
    const totals = screen.getByLabelText('Mistake and review totals')
    expect(within(totals).getByText('Active mistake patterns').parentElement).toHaveTextContent('1')
    expect(within(totals).getByText('Mastered mistake patterns').parentElement).toHaveTextContent(
      '1',
    )
    expect(within(totals).getByText('Similar questions practiced').parentElement).toHaveTextContent(
      '4',
    )
    expect(
      within(totals).getByText('Review questions marked right').parentElement,
    ).toHaveTextContent('3')
    expect(screen.getByText('Subtraction — 3 misses.')).toBeInTheDocument()
    const active = screen.getByRole('article', { name: '4 + 3 = 7, level 1' })
    expect(within(active).getByText('Times marked wrong').parentElement).toHaveTextContent('2')
    expect(within(active).getByRole('progressbar')).toHaveAttribute('value', '0')
    fireEvent.click(screen.getByRole('radio', { name: 'Mastered mistakes (1)' }))
    expect(screen.queryByRole('article', { name: '4 + 3 = 7, level 1' })).not.toBeInTheDocument()
    const mastered = screen.getByRole('article', { name: '8 − 2 = 6, level 1' })
    expect(within(mastered).getByRole('progressbar')).toHaveAttribute('value', '3')
    expect(within(mastered).getByRole('progressbar')).toHaveAccessibleName(
      /3 consecutive review answers/,
    )
    expect(mastered.querySelector('time')).toHaveAttribute(
      'datetime',
      data.mistakePatterns![1].lastIncorrectAt,
    )
    expect(JSON.stringify(data)).toBe(before)
  })
  it('paginates detailed patterns and resets the visible limit when changing views', () => {
    const events = Array.from({ length: 12 }, (_, i) =>
      wrongFact(`m-${i}`, 'addition', Math.floor(i / 10), i % 10, '2026-10-18T00:00:00Z'),
    )
    const data = trackMistakes({ ...emptySavedData(), mistakeEvents: events })
    render(<MistakeStatistics data={data} />)
    expect(screen.getAllByRole('article')).toHaveLength(10)
    fireEvent.click(screen.getByRole('button', { name: 'Show more mistakes' }))
    expect(screen.getAllByRole('article')).toHaveLength(12)
    fireEvent.click(screen.getByRole('radio', { name: 'Mastered mistakes (0)' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Active mistakes (12)' }))
    expect(screen.getAllByRole('article')).toHaveLength(10)
  })
})
