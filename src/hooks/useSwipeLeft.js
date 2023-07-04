import { ref } from 'vue'

const SWIPE_RATIO_ACTIVATION = 2
const SWIPE_OFFSET_X_ACTIVATION = 16

export function useSwipeLeft(onSwipe) {
  const swipeStarted = ref(false)
  const elementLeftOffset = ref(0)

  const onMove = (e) => {
    const offsetX = e.touchstartX - e.touchmoveX
    const offsetY = e.touchstartY - e.touchmoveY
    const ratio = offsetX / offsetY
    const swipeActivated = ratio > SWIPE_RATIO_ACTIVATION && offsetX > SWIPE_OFFSET_X_ACTIVATION

    if (swipeActivated) {
      swipeStarted.value = true
    }

    if (offsetX > 100) {
      onSwipe()
    }

    if (swipeStarted.value) {
      elementLeftOffset.value = -offsetX
    }
  }

  const onSwipeEnd = () => {
    elementLeftOffset.value = 0
    swipeStarted.value = false
  }

  return {
    onMove,
    onSwipeEnd,
    elementLeftOffset
  }
}
