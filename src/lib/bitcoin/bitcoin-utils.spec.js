import { describe, expect, it } from 'vitest'
import { convertToBigIntSmallestUnit, convertToSmallestUnit } from './bitcoin-utils'

describe('bitcoin-utils', () => {
  it('converts to bigint smallest units without losing precision for large values', () => {
    const amount = '123456789.98765432'
    const multiplier = 100000000

    expect(convertToBigIntSmallestUnit(amount, multiplier)).toBe(12345678998765432n)
  })

  it('keeps number conversion behavior for safe integer-sized values', () => {
    expect(convertToSmallestUnit('0.00002610', 100000000)).toBe(2610)
  })
})
