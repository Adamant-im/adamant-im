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

export const vibrate = {
  veryShort() {
    if (!checkVibrateIsSupported()) return

    navigator.vibrate(VIBRATION_PATTERN.VERY_SHORT)
  },
  short() {
    if (!checkVibrateIsSupported()) return

    navigator.vibrate(VIBRATION_PATTERN.SHORT)
  },
  medium() {
    if (!checkVibrateIsSupported()) return

    navigator.vibrate(VIBRATION_PATTERN.MEDIUM)
  },
  long() {
    if (!checkVibrateIsSupported()) return

    navigator.vibrate(VIBRATION_PATTERN.LONG)
  },
  doubleVeryShort() {
    if (!checkVibrateIsSupported()) return

    navigator.vibrate(VIBRATION_PATTERN.DOUBLE_VERY_SHORT)
  },
  tripleVeryShort() {
    if (!checkVibrateIsSupported()) return

    navigator.vibrate(VIBRATION_PATTERN.TRIPLE_VERY_SHORT)
  }
}
