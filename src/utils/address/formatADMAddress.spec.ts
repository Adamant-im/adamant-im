import { describe, expect, it } from 'vitest'
import { formatADMAddress } from './formatADMAddress'

describe('formatADMAddress', () => {
  it('should format ADM address without chat name', () => {
    expect(formatADMAddress('U1234567890')).toBe('U1234567890')
  })

  it('should format ADM address with chat name', () => {
    expect(formatADMAddress('U0987654321', 'John')).toBe('John (U0987654321)')
  })
})
