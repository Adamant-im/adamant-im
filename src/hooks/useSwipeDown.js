import { ref } from 'vue'

/**
 * Triggers `onSwipe` event when the `offsetY`
 * reaches `SWIPE_TRIGGER_ACTIVATION` value
 */
const SWIPE_TRIGGER_ACTIVATION = 40

/**
 * The higher the value, the slower the element will move.
 */
const SWIPE_SLOWING_RATIO = 3

export function useSwipeDown(onSwipe) {
  const elementTopOffset = ref(0)

  const onMove = (e) => {
    const offsetY = e.touchstartY - e.touchmoveY

    elementTopOffset.value = -offsetY / SWIPE_SLOWING_RATIO

    if (offsetY > SWIPE_TRIGGER_ACTIVATION) {
      onSwipe()
    }
  }

  const onSwipeEnd = () => {
    elementTopOffset.value = 0
  }

  return {
    onMove,
    onSwipeEnd,
    elementTopOffset
  }
}
