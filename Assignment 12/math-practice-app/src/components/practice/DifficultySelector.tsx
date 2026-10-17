import { DIFFICULTIES } from '../../constants/practice'
import type { DifficultyLevel } from '../../types'

interface DifficultySelectorProps {
  value: DifficultyLevel
  onChange: (value: DifficultyLevel) => void
}

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <fieldset className="setup-fieldset">
      <legend>2. Pick your challenge</legend>
      <div className="choice-grid difficulty-grid">
        {DIFFICULTIES.map((option) => (
          <label
            className={`choice-card difficulty-choice${value === option.value ? ' selected' : ''}`}
            key={option.value}
          >
            <input
              type="radio"
              name="difficulty"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              <span className="choice-description">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
