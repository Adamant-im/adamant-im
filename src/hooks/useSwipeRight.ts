import { ref } from 'vue'
import { VuetifyTouchEvent } from '@/types/vuetify'

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

export function useSwipeRight(onSwipe: () => void, triggerActivationOffset = 100, blockingLeft = true) {
  const swipeStarted = ref(false);
  const elementRightOffset = ref(0);

  const onMove = (e: VuetifyTouchEvent) => {
    const offsetX = e.touchmoveX - e.touchstartX;
    const offsetY = e.touchmoveY - e.touchstartY;
    const ratio = offsetX / offsetY;

    if (blockingLeft && offsetX <= 0) {
      return
    }

    const swipeActivated = ratio > SWIPE_RATIO_ACTIVATION && offsetX > SWIPE_OFFSET_X_ACTIVATION;


    if (swipeActivated) {
      swipeStarted.value = true;
    }

    if (swipeStarted.value) {
      window.requestAnimationFrame(() => {
        elementRightOffset.value = offsetX;
      })
    }

    if (swipeStarted.value && offsetX > triggerActivationOffset) {
      onSwipe();
    }
  };

  const onSwipeEnd = () => {
    elementRightOffset.value = 0;
    swipeStarted.value = false;
  };

  return {
    onMove,
    onSwipeEnd,
    elementRightOffset,
  };
}
