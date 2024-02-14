import { describe, expect, it } from 'vitest'
import { formatBTCAddress } from './formatBTCAddress'

const OWN_BTC_ADDRESS = '1EQuRM9nKdzUFUadUXKcaHQCeMR5eGsWwP'

const PARTNER_BTC_ADDRESS = '16ADr4P8s2BssFKhJdQ9gRMDR7oSZ289C3'
const PARTNER_ADM_ADDRESS = 'U0987654321'

const translations: Record<string, string> = {
  'transaction.me': 'Me'
}
const tFunction = (key: string) => {
  const translation = translations[key]

  return translation || key
}

describe('formatBTCAddress', () => {
  it('should format own BTC address', () => {
    expect(formatBTCAddress(OWN_BTC_ADDRESS, OWN_BTC_ADDRESS, tFunction)).toBe(
      `Me (1EQuRM9nKdzUFUadUXKcaHQCeMR5eGsWwP)`
    )
  })

  it('should format single BTC address without chat name', () => {
    expect(formatBTCAddress(PARTNER_BTC_ADDRESS, OWN_BTC_ADDRESS, tFunction)).toBe(
      '16ADr4P8s2BssFKhJdQ9gRMDR7oSZ289C3'
    )
  })

  it('should format single BTC address with chat name', () => {
    expect(formatBTCAddress(PARTNER_BTC_ADDRESS, OWN_BTC_ADDRESS, tFunction, '', 'John')).toBe(
      'John (16ADr4P8s2BssFKhJdQ9gRMDR7oSZ289C3)'
    )
  })

  it('should format single BTC address with ADM address provided', () => {
    expect(
      formatBTCAddress(PARTNER_BTC_ADDRESS, OWN_BTC_ADDRESS, tFunction, PARTNER_ADM_ADDRESS, '')
    ).toBe(`16ADr4P8s2BssFKhJdQ9gRMDR7oSZ289C3 (U0987654321)`)
  })

  it('should use the chat name if both, chat name and ADM address provided', () => {
    expect(
      formatBTCAddress(PARTNER_BTC_ADDRESS, OWN_BTC_ADDRESS, tFunction, PARTNER_ADM_ADDRESS, 'John')
    ).toBe(`John (16ADr4P8s2BssFKhJdQ9gRMDR7oSZ289C3)`)
  })
})
