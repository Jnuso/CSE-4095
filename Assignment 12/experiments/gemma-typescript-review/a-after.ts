export type Attempt = { questionId: string; selectedAnswer: number };

export function buildAttempt(
  questionId: string,
  selectedAnswer: number | null,
): Attempt | null {
  if (!selectedAnswer) return null;
  return { questionId, selectedAnswer };
}
