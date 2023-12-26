import { computed, Ref, ref } from 'vue'

import { VuetifyTouchEvent } from '@/types/vuetify'

/**
 * Triggers `onAction` event when the `offsetY`
 * reaches `PULL_ACTIVATION_OFFSET` value
 */
const PULL_ACTIVATION_OFFSET = 128 // px

/**
 * Must swipe at least specified value to activate the swipe.
 */
const SWIPE_DOWN_ACTIVATION_OFFSET_Y = 56 // px

/**
 * The higher the value, the slower the element will move.
 */
const SWIPE_SLOWDOWN_RATIO = 3

interface UsePullDownResult {
  onSwiping: (e: VuetifyTouchEvent) => void
  onSwipeEnd: () => void
  elementTopOffset: Ref<number>
  /**
   * The percentage value for current progress
   */
  progressPercentage: Ref<number>
  pullDownActivated: Ref<boolean>
  pullDownReleased: Ref<boolean>
}

export function usePullDown(onAction: () => void): UsePullDownResult {
  const elementTopOffset = ref(0)
  const swipeActivated = ref(false)
  const pullActionActivated = ref(false)

  const progressPercentage = computed(() => {
    return Math.min((elementTopOffset.value * 100) / PULL_ACTIVATION_OFFSET, 100)
  })
  const pullDownActivated = computed(() => progressPercentage.value === 100)
  const pullDownReleased = computed(() => elementTopOffset.value === 0)

  const onSwiping = (e: VuetifyTouchEvent) => {
    const offsetY = e.touchstartY - e.touchmoveY
    const elementOffset = -offsetY

    if (elementOffset < SWIPE_DOWN_ACTIVATION_OFFSET_Y) {
      return
    }

    elementTopOffset.value = Math.max(0, elementOffset) / SWIPE_SLOWDOWN_RATIO

    if (elementTopOffset.value > PULL_ACTIVATION_OFFSET) {
      pullActionActivated.value = true
    }
  }

  const onSwipeEnd = () => {
    if (pullActionActivated.value) {
      onAction()
      pullActionActivated.value = false
    }

    elementTopOffset.value = 0
    swipeActivated.value = false
  }

  return {
    onSwiping,
    onSwipeEnd,
    elementTopOffset,
    progressPercentage,
    pullDownActivated,
    pullDownReleased
  }
}
