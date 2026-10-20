// Optional local feedback only; a blocked/unsupported audio device never stops practice.
export async function playFlipSound(): Promise<void> {
  let context: AudioContext | undefined
  try {
    context = new AudioContext()
    await context.resume()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = 523.25
    gain.gain.setValueAtTime(0.04, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08)
    oscillator.connect(gain)
    gain.connect(context.destination)
    const active = context
    oscillator.onended = () => {
      void active.close().catch(() => {})
    }
    oscillator.start()
    oscillator.stop(context.currentTime + 0.09)
  } catch {
    if (context) await context.close().catch(() => {})
  }
}
