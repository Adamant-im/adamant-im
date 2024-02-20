import { describe, it, expect } from 'vitest'

import smartNumber from './smartNumber.ts'

describe('smartNumber', () => {
  it('should convert amount to compact notation', () => {
    const numbers = [
      12345678,
      123456789.888742,
      '1234567890.0000054',
      12345678901.03,
      '123456789012.34560',
      '1234567890123',
      '12345678901234.001233',
      123456789012345,
      '1234567890123456.594679999999999'
    ]

    expect(smartNumber(numbers[0])).toBe('12M')
    expect(smartNumber(numbers[1])).toBe('123M')
    expect(smartNumber(numbers[2])).toBe('1.2B')
    expect(smartNumber(numbers[3])).toBe('12B')
    expect(smartNumber(numbers[4])).toBe('123B')
    expect(smartNumber(numbers[5])).toBe('1.2T')
    expect(smartNumber(numbers[6])).toBe('12T')
    expect(smartNumber(numbers[7])).toBe('123T')
  })

  it('should divide thousands by commas', () => {
    const numbers = [12345.67, 1234.567, 12345, '12345.6', '123456.678', '1234567.6789']

    expect(smartNumber(numbers[0])).toBe('12,345')
    expect(smartNumber(numbers[1])).toBe('1,234.5')
    expect(smartNumber(numbers[2])).toBe('12,345')
    expect(smartNumber(numbers[3])).toBe('12,345')
    expect(smartNumber(numbers[4])).toBe('123,456')
    expect(smartNumber(numbers[5])).toBe('1,234,567')
  })

  it('should round decimal part', () => {
    const numbers = [123.4567, 12.34567, 0.0697, '0.0007', '0.00077', '0.0001', 0.00018]

    expect(smartNumber(numbers[0])).toBe('123.45')
    expect(smartNumber(numbers[1])).toBe('12.345')
    expect(smartNumber(numbers[2])).toBe('0.0697')
    expect(smartNumber(numbers[3])).toBe('0.0007')
    expect(smartNumber(numbers[4])).toBe('0.0007')
    expect(smartNumber(numbers[5])).toBe('0.0001')
    expect(smartNumber(numbers[6])).toBe('0.0001')
  })

  it('should cut zeroes', () => {
    const numbers = [0.0001, 0.00009, 0.000091, '0.00009104', 0.00008, 9.000089, 4.00002109]

    expect(smartNumber(numbers[0])).toBe('0.0001')
    expect(smartNumber(numbers[1])).toBe('0.00…9')
    expect(smartNumber(numbers[2])).toBe('0.00…9')
    expect(smartNumber(numbers[3])).toBe('0.00…9')
    expect(smartNumber(numbers[4])).toBe('0.00…8')
    expect(smartNumber(numbers[5])).toBe('9.00…8')
    expect(smartNumber(numbers[6])).toBe('4.00…2')
  })
})
