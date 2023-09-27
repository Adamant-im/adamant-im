declare const VIBRATION_PATTERN: Record<string, number[]>

declare function createVibrationPattern(pattern: number[]): () => void

export declare const vibrate: {
  veryShort: () => void
  short: () => void
  medium: () => void
  long: () => void
  doubleVeryShort: () => void
  tripleVeryShort: () => void
}
