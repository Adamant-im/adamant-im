import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_LOCALE, applyLocale } from '@/i18n'
import { useSwipeLeft } from '@/hooks/useSwipeLeft'

const swipe = (fromX, toX, { fromY = 300, toY = 300 } = {}) => {
  const onSwipe = vi.fn()
  const { onMove, elementLeftOffset } = useSwipeLeft(onSwipe)

  onMove({ touchstartX: fromX, touchmoveX: toX, touchstartY: fromY, touchmoveY: toY })

  return { onSwipe, offset: elementLeftOffset.value }
}

describe('useSwipeLeft', () => {
  afterEach(() => {
    applyLocale(DEFAULT_LOCALE)
  })

  it('replies on a swipe to the left in LTR locales and moves the message with the finger', () => {
    applyLocale('en')

    const towardsStart = swipe(300, 180)
    expect(towardsStart.onSwipe).toHaveBeenCalledOnce()
    expect(towardsStart.offset).toBe(-120)

    expect(swipe(180, 300).onSwipe).not.toHaveBeenCalled()
  })

  it('replies on a swipe to the right in RTL locales, where messages are mirrored', () => {
    applyLocale('ar')

    const towardsStart = swipe(180, 300)
    expect(towardsStart.onSwipe).toHaveBeenCalledOnce()
    expect(towardsStart.offset).toBe(120)

    expect(swipe(300, 180).onSwipe).not.toHaveBeenCalled()
  })

  it('keeps a horizontal swipe active when the finger drifts down slightly', () => {
    applyLocale('en')

    expect(swipe(300, 180, { fromY: 300, toY: 310 }).onSwipe).toHaveBeenCalledOnce()
  })

  it('ignores mostly vertical movement', () => {
    applyLocale('en')

    const { onSwipe, offset } = swipe(300, 180, { fromY: 300, toY: 500 })

    expect(onSwipe).not.toHaveBeenCalled()
    expect(offset).toBe(0)
  })
})
