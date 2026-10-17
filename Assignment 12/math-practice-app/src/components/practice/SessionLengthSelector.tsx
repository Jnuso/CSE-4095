import { SESSION_LENGTHS } from '../../constants/practice'
import type { SessionLength } from '../../types'

interface SessionLengthSelectorProps {
  value: SessionLength
  onChange: (value: SessionLength) => void
}

export default function SessionLengthSelector({ value, onChange }: SessionLengthSelectorProps) {
  return (
    <fieldset className="setup-fieldset">
      <legend>3. How long would you like to practice?</legend>
      <div className="choice-grid length-grid">
        {SESSION_LENGTHS.map((option) => (
          <label
            className={`choice-card${value === option.value ? ' selected' : ''}`}
            key={option.value}
          >
            <input
              type="radio"
              name="session-length"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
