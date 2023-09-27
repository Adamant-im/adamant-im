const VIBRATION_PATTERN = {
  VERY_SHORT: [25],
  SHORT: [50],
  MEDIUM: [80],
  LONG: [300],
  DOUBLE_VERY_SHORT: [25, 25],
  TRIPLE_VERY_SHORT: [25, 25, 25]
}

function checkVibrateIsSupported() {
  if ('vibrate' in navigator) {
    return true
  }

  console.warn('Navigator: vibrate() method is not supported by your browser')
  return false
}

function createVibrationPattern(pattern) {
  return () => {
    if (!checkVibrateIsSupported()) return

    navigator.vibrate(pattern)
  }
}

export const vibrate = {
  veryShort: createVibrationPattern(VIBRATION_PATTERN.VERY_SHORT),
  short: createVibrationPattern(VIBRATION_PATTERN.SHORT),
  medium: createVibrationPattern(VIBRATION_PATTERN.MEDIUM),
  long: createVibrationPattern(VIBRATION_PATTERN.LONG),
  doubleVeryShort: createVibrationPattern(VIBRATION_PATTERN.DOUBLE_VERY_SHORT),
  tripleVeryShort: createVibrationPattern(VIBRATION_PATTERN.TRIPLE_VERY_SHORT)
}
