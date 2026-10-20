/// <reference types="vite/client" />
// Log only a diagnostic code and count, never saved data, credentials or exception details.
export function reportDevelopmentError(code: string, attempts: number): void {
  if (import.meta.env?.DEV) console.warn(`[Math Practice] ${code}; attempts=${attempts}`)
}
