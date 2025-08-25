export const VIBRATION_PATTERN: Record<string, number[]> = {
  VERY_SHORT: [40],
  SHORT: [80],
  MEDIUM: [160],
  LONG: [300],
  DOUBLE_VERY_SHORT: [40, 60, 40],
  TRIPLE_VERY_SHORT: [40, 60, 40, 60, 40],
  DOUBLE_SHORT: [80, 60, 80]
}

function checkVibrateIsSupported() {
  if ('vibrate' in navigator) {
    return true
  }

  console.warn('Navigator: vibrate() method is not supported by your browser')
  return false
}

export function createVibrationPattern(pattern: number[]): () => void {
  return () => {
    if (!checkVibrateIsSupported()) return

    if (navigator.userAgentData?.mobile) navigator.vibrate(pattern)
  }
}

export const vibrate: Record<string, () => void> = {
  veryShort: createVibrationPattern(VIBRATION_PATTERN.VERY_SHORT),
  short: createVibrationPattern(VIBRATION_PATTERN.SHORT),
  medium: createVibrationPattern(VIBRATION_PATTERN.MEDIUM),
  long: createVibrationPattern(VIBRATION_PATTERN.LONG),
  doubleVeryShort: createVibrationPattern(VIBRATION_PATTERN.DOUBLE_VERY_SHORT),
  tripleVeryShort: createVibrationPattern(VIBRATION_PATTERN.TRIPLE_VERY_SHORT),
  doubleShort: createVibrationPattern(VIBRATION_PATTERN.DOUBLE_SHORT)
}
