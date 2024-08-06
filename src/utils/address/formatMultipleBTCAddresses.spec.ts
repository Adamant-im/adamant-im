import { describe, expect, it } from 'vitest'
import { formatMultipleBTCAddresses } from './formatMultipleBTCAddresses'

const OWN_BTC_ADDRESS = '1EQuRM9nKdzUFUadUXKcaHQCeMR5eGsWwP'

const translations: Record<string, string> = {
  'transaction.me_and_addresses': 'Me and {n} more addresses',
  'transaction.addresses': 'and {n} more address'
}
const tFunction = (key: string, _count?: number) => {
  const translation = translations[key]

  return translation || key
}

describe('formatMultipleBTCAddresses', () => {
  it('should format multiple BTC addresses including "Me"', () => {
    expect(
      formatMultipleBTCAddresses(
        [
          OWN_BTC_ADDRESS,
          '16ADr4P8s2BssFKhJdQ9gRMDR7oSZ289C3',
          '14bsMRQRfht6VuPm3JynBHggZmJFnewRmD'
        ],
        OWN_BTC_ADDRESS,
        tFunction
      )
    ).toBe('Me and {n} more addresses')
  })

  it('should format multiple BTC addresses without "Me"', () => {
    expect(
      formatMultipleBTCAddresses(
        ['16ADr4P8s2BssFKhJdQ9gRMDR7oSZ289C3', '14bsMRQRfht6VuPm3JynBHggZmJFnewRmD'],
        OWN_BTC_ADDRESS,
        tFunction
      )
    ).toBe('and {n} more address')
  })
})
