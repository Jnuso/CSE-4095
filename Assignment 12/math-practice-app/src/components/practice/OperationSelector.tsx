import { OPERATIONS } from '../../constants/practice'
import type { MathOperation } from '../../types'

interface OperationSelectorProps {
  value: MathOperation[]
  onChange: (value: MathOperation[]) => void
}

export default function OperationSelector({ value, onChange }: OperationSelectorProps) {
  return (
    <fieldset className="setup-fieldset" aria-describedby="operation-help">
      <legend>1. What would you like to practice?</legend>
      <p className="field-help" id="operation-help">
        Choose one or mix a few together.
      </p>
      <div className="choice-grid operations-grid">
        {OPERATIONS.map((option) => (
          <label
            key={option.value}
            className={`choice-card${value.includes(option.value) ? ' selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? OPERATIONS.filter(
                        (item) => value.includes(item.value) || item.value === option.value,
                      ).map((item) => item.value)
                    : value.filter((item) => item !== option.value),
                )
              }
            />
            <span className="choice-symbol" aria-hidden="true">
              {option.symbol}
            </span>
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <div className="selection-shortcuts">
        <button
          className="text-button"
          type="button"
          onClick={() => onChange(OPERATIONS.map((option) => option.value))}
        >
          Select all operations
        </button>
        <button className="text-button" type="button" onClick={() => onChange([])}>
          Clear selection
        </button>
      </div>
    </fieldset>
  )
}
