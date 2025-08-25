import { trimTrailingZeros } from '@/lib/numericHelpers'
import { describe, test, expect } from 'vitest'

describe('trimTrailingZeros', () => {
  describe('should remove trailing zeros after decimal point', () => {
    test('simple trailing zeros', () => {
      expect(trimTrailingZeros('1.50000')).toBe('1.5')
      expect(trimTrailingZeros('123.456000')).toBe('123.456')
    })

    test('mixed significant digits', () => {
      expect(trimTrailingZeros('1.01000')).toBe('1.01')
      expect(trimTrailingZeros('1.10100')).toBe('1.101')
    })
  })

  describe('should not modify integers', () => {
    test('whole numbers', () => {
      expect(trimTrailingZeros('1000')).toBe('1000')
      expect(trimTrailingZeros('0')).toBe('0')
    })
  })

  describe('should not modify numbers without trailing zeros', () => {
    test('already clean decimals', () => {
      expect(trimTrailingZeros('1.5')).toBe('1.5')
      expect(trimTrailingZeros('0.123')).toBe('0.123')
      expect(trimTrailingZeros('999.999')).toBe('999.999')
    })
  })

  describe('edge cases', () => {
    test('very small numbers', () => {
      expect(trimTrailingZeros('0.000010000')).toBe('0.00001')
      expect(trimTrailingZeros('0.000000100')).toBe('0.0000001')
    })

    test('cryptocurrency amounts', () => {
      // ETH (18 decimals)
      expect(trimTrailingZeros('0.001000000000000000')).toBe('0.001')
      expect(trimTrailingZeros('1.500000000000000000')).toBe('1.5')

      // BTC (8 decimals)
      expect(trimTrailingZeros('0.00000100')).toBe('0.000001')
      expect(trimTrailingZeros('1.23456700')).toBe('1.234567')
    })
  })
})
