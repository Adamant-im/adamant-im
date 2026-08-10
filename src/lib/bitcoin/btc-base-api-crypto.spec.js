// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { Cryptos } from '@/lib/constants'

import { getAccount } from './btc-base-api'

const TEST_ACCOUNT_PASSPHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe('BTC-like account derivation', () => {
  it.each([
    [Cryptos.BTC, '1C4hBnuHkNzkdmE56AFTTuXSRTGJdkAz91'],
    [Cryptos.DOGE, 'DGCnj3qw3nu3AmQfpkF21fh3JazbxnVVCk'],
    [Cryptos.DASH, 'XmkY23ZBi6DLnhpex3ZgKSDEFnqzhkL1xo']
  ])('preserves the %s address after the SHA-256 implementation migration', (crypto, address) => {
    expect(getAccount(crypto, TEST_ACCOUNT_PASSPHRASE).address).toBe(address)
  })
})
