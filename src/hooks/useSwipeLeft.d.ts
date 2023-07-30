import { Ref } from 'vue'

import { VuetifyTouchEvent } from '@/types/vuetify'

declare const SWIPE_RATIO_ACTIVATION: number
declare const SWIPE_OFFSET_X_ACTIVATION: number
declare const SWIPE_TRIGGER_ACTIVATION: number

type OnSwipeCb = () => void

interface UseSwipeLeftResult {
  onMove: (e: VuetifyTouchEvent) => void
  onSwipeEnd: () => void
  elementLeftOffset: Ref<number>
}

export function useSwipeLeft(onSwipe: OnSwipeCb): UseSwipeLeftResult
