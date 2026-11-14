import { ref } from 'vue'

import { i18n, isRtlLocale } from '@/i18n'

/**
 * Ratio between swipe offsetX / offsetY.
 * The higher value, the smoother swipe is needed on X axis
 * to activate the swipe event.
 * @type {number}
 */
const SWIPE_RATIO_ACTIVATION = 2
/**
 * The difference between swipe start position and the current position.
 * If the number is higher than specified below, then swipe event must
 * be activated.
 * @type {number}
 */
const SWIPE_OFFSET_X_ACTIVATION = 16

/**
 * Triggers `onSwipe` event when the `offsetX`
 * reaches `SWIPE_TRIGGER_ACTIVATION` value
 */
const SWIPE_TRIGGER_ACTIVATION = 100

/**
 * Swipe-to-reply towards the start of the line: to the left in LTR locales and to the right
 * in RTL locales, where messages are mirrored.
 */
export function useSwipeLeft(onSwipe) {
  const swipeStarted = ref(false)
  const elementLeftOffset = ref(0)

  const onMove = (e) => {
    const towardsStart = isRtlLocale(i18n.global.locale.value) ? -1 : 1
    const offsetX = (e.touchstartX - e.touchmoveX) * towardsStart
    const offsetY = e.touchstartY - e.touchmoveY
    // A slight vertical drift in either direction must not cancel a horizontal swipe
    const ratio = offsetX / Math.abs(offsetY)

    const swipeActivated = ratio > SWIPE_RATIO_ACTIVATION && offsetX > SWIPE_OFFSET_X_ACTIVATION

    if (swipeActivated) {
      swipeStarted.value = true
    }

    if (swipeStarted.value) {
      // The message follows the finger
      elementLeftOffset.value = e.touchmoveX - e.touchstartX
    }

    if (swipeStarted.value && offsetX > SWIPE_TRIGGER_ACTIVATION) {
      onSwipe()
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
