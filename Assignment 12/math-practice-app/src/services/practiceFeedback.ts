const encouragement = {
  right: ['Nice work!', 'Great thinking!', 'Keep up the practice!'],
  wrong: [
    'Keep practicing, one step at a time.',
    'You can try another. Take your time.',
    'Every try helps you learn.',
  ],
}

export function chooseFeedback(right: boolean, random: () => number = Math.random): string {
  const messages = encouragement[right ? 'right' : 'wrong']
  return messages[
    Math.min(messages.length - 1, Math.max(0, Math.floor(random() * messages.length)))
  ]!
}
