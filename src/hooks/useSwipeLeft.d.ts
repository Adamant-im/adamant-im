declare const SWIPE_RATIO_ACTIVATION: number
declare const SWIPE_OFFSET_X_ACTIVATION: number
declare const SWIPE_TRIGGER_ACTIVATION: number

type OnSwipeCb = () => void

interface UseSwipeLeftResult {
  onMove: (e: TouchEvent) => void
  onSwipeEnd: () => void
  elementLeftOffset: number
}

export function useSwipeLeft(onSwipe: () => OnSwipeCb): UseSwipeLeftResult
