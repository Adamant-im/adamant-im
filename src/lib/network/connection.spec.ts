import { describe, expect, it } from 'vitest'
import { getConnectionAwareTimeout, isPotentiallySlowConnection } from './connection'

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
    expect(isPotentiallySlowConnection({ downlink: 1.5 })).toBe(true)
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
})
