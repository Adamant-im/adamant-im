const VIBRATION_INTERVAL = {
  SHORT: 50
}

function checkVibrateIsSupported() {
  if ('vibrate' in navigator) {
    return true
  }

  console.warn('Navigator: vibrate() method is not supported by your browser')
  return false
}

export const vibrate = {
  short() {
    if (checkVibrateIsSupported()) {
      navigator.vibrate(VIBRATION_INTERVAL.SHORT)
    }
  }
}
