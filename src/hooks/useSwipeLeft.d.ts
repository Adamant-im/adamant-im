type OnSwipeCb = () => void

interface UseSwipeLeftResult {
  onMove: (e: TouchEvent) => void
  onSwipeEnd: () => void
  elementLeftOffset: number
}

export function useSwipeLeft(onSwipe: () => OnSwipeCb): UseSwipeLeftResult
