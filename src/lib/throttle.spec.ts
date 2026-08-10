import { afterEach, describe, expect, it, vi } from 'vitest'

import { throttle } from './throttle'

describe('throttle', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the leading call and the latest trailing call', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const callback = vi.fn((value: number) => value)
    const throttled = throttle(callback, 500)

    expect(throttled(1)).toBe(1)
    vi.advanceTimersByTime(100)
    expect(throttled(2)).toBe(1)
    vi.advanceTimersByTime(100)
    throttled(3)

    expect(callback).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(300)
    expect(callback).toHaveBeenNthCalledWith(2, 3)
  })

  it('supports cancellation and explicit flushing', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const callback = vi.fn((value: number) => value)
    const throttled = throttle(callback, 500)

    throttled(1)
    throttled(2)
    expect(throttled.flush()).toBe(2)

    throttled(3)
    throttled.cancel()
    vi.advanceTimersByTime(500)

    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('preserves the invocation context', () => {
    vi.useFakeTimers()
    const context = { value: 7 }
    const callback = vi.fn(function (this: typeof context) {
      return this.value
    })
    const throttled = throttle(callback, 100)

    expect(throttled.call(context)).toBe(7)
  })
})
