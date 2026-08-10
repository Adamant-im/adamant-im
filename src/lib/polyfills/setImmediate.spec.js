import { afterEach, describe, expect, it, vi } from 'vitest'

import { installSetImmediate } from './setImmediate'

describe('setImmediate CSP-safe polyfill', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('schedules function callbacks with their arguments', () => {
    vi.useFakeTimers()
    const target = {
      clearTimeout,
      setTimeout
    }
    const callback = vi.fn()

    installSetImmediate(target)
    target.setImmediate(callback, 'message', 7)
    vi.runAllTimers()

    expect(callback).toHaveBeenCalledWith('message', 7)
  })

  it('rejects string callbacks instead of compiling them', () => {
    const target = {
      clearTimeout,
      setTimeout
    }

    installSetImmediate(target)

    expect(() => target.setImmediate('globalThis.compromised = true')).toThrow(TypeError)
  })

  it('cancels scheduled callbacks', () => {
    vi.useFakeTimers()
    const target = {
      clearTimeout,
      setTimeout
    }
    const callback = vi.fn()

    installSetImmediate(target)
    const handle = target.setImmediate(callback)
    target.clearImmediate(handle)
    vi.runAllTimers()

    expect(callback).not.toHaveBeenCalled()
  })
})
