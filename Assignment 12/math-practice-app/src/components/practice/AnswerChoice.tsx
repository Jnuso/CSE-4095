interface AnswerChoiceProps {
  shortcut?: number
  value: number
  selected: boolean
  disabled?: boolean
  onSelect: (value: number) => void
}

export default function AnswerChoice({
  shortcut,
  value,
  selected,
  disabled = false,
  onSelect,
}: AnswerChoiceProps) {
  return (
    <button
      type="button"
      className="answer-choice"
      aria-label={`Answer ${value}`}
      aria-pressed={selected}
      aria-keyshortcuts={shortcut === undefined ? undefined : String(shortcut)}
      disabled={disabled}
      onClick={() => onSelect(value)}
    >
      <span>{value}</span>
      <span className="answer-marker" aria-hidden="true">
        {selected ? '✓' : ''}
      </span>
    </button>
  )
}
