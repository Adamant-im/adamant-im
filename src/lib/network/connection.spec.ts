import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  __resetConnectionQualityStateForTests,
  getConnectionAwareTimeout,
  isPotentiallySlowConnection,
  startConnectionQualityMonitoring
} from './connection'
import { logger } from '@/utils/devTools/logger'

const navigatorConnectionDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  'connection'
)

afterEach(() => {
  vi.restoreAllMocks()
  __resetConnectionQualityStateForTests()

  if (navigatorConnectionDescriptor) {
    Object.defineProperty(globalThis.navigator, 'connection', navigatorConnectionDescriptor)
  } else {
    Reflect.deleteProperty(globalThis.navigator, 'connection')
  }
})

describe('network connection helpers', () => {
  it('returns false when Network Information API is unavailable', () => {
    expect(isPotentiallySlowConnection(undefined)).toBe(false)
    expect(isPotentiallySlowConnection(null)).toBe(false)
  })

  it('detects potentially slow connections by network type hints', () => {
    expect(isPotentiallySlowConnection({ effectiveType: '3g' })).toBe(true)
    expect(isPotentiallySlowConnection({ effectiveType: 'slow-2g' })).toBe(true)
  })

  it('detects potentially slow connections by performance hints', () => {
    expect(isPotentiallySlowConnection({ saveData: true })).toBe(true)
    expect(isPotentiallySlowConnection({ rtt: 350 })).toBe(true)
    expect(isPotentiallySlowConnection({ downlink: 1 })).toBe(true)
    expect(isPotentiallySlowConnection({ downlink: 0 })).toBe(false)
  })

  it('does not classify fast connections as slow', () => {
    expect(isPotentiallySlowConnection({ effectiveType: '4g', rtt: 100, downlink: 12 })).toBe(false)
  })

  it('adjusts timeout by x1.5 on potentially slow links', () => {
    expect(getConnectionAwareTimeout(10_000, { effectiveType: '3g' })).toBe(15_000)
    expect(getConnectionAwareTimeout(3_000, { saveData: true })).toBe(4_500)
  })

  it('keeps timeout unchanged on regular links', () => {
    expect(getConnectionAwareTimeout(10_000, { effectiveType: '4g' })).toBe(10_000)
  })

  it('logs with public level when runtime connection changes to slow and back', () => {
    const loggerSpy = vi.spyOn(logger, 'log').mockImplementation(() => {})

    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        rtt: 100,
        downlink: 10
      }
    })
    getConnectionAwareTimeout(10_000)

    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '3g'
      }
    })
    getConnectionAwareTimeout(10_000)

    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        rtt: 100,
        downlink: 10
      }
    })
    getConnectionAwareTimeout(10_000)

    expect(loggerSpy).toHaveBeenNthCalledWith(
      1,
      'network/connection',
      'public',
      'Potentially slow connection detected. Increasing network timeouts by x1.5.'
    )
    expect(loggerSpy).toHaveBeenNthCalledWith(
      2,
      'network/connection',
      'public',
      'Connection quality restored. Returning network timeouts to defaults.'
    )
    expect(loggerSpy).toHaveBeenCalledTimes(2)
  })

  it('does not log on first runtime check even if connection is slow', () => {
    const loggerSpy = vi.spyOn(logger, 'log').mockImplementation(() => {})

    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '3g'
      }
    })

    getConnectionAwareTimeout(10_000)

    expect(loggerSpy).not.toHaveBeenCalled()
  })

  it('starts connection monitoring and subscribes to connection change events', () => {
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()

    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        addEventListener,
        removeEventListener
      }
    })

    const stopMonitoring = startConnectionQualityMonitoring()
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    stopMonitoring()
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('uses reliable Network Information API values without probe fallback', () => {
    const loggerSpy = vi.spyOn(logger, 'log').mockImplementation(() => {})

    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        rtt: 0,
        downlink: 0,
        saveData: false
      }
    })
    getConnectionAwareTimeout(10_000)

    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '2g',
        rtt: 2150,
        downlink: 0.4,
        saveData: false
      }
    })
    getConnectionAwareTimeout(10_000)

    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        rtt: 0,
        downlink: 0,
        saveData: false
      }
    })
    getConnectionAwareTimeout(10_000)

    expect(loggerSpy).toHaveBeenNthCalledWith(
      1,
      'network/connection',
      'public',
      'Potentially slow connection detected. Increasing network timeouts by x1.5.'
    )
    expect(loggerSpy).toHaveBeenNthCalledWith(
      2,
      'network/connection',
      'public',
      'Connection quality restored. Returning network timeouts to defaults.'
    )
    expect(loggerSpy).toHaveBeenCalledTimes(2)
  })
})
