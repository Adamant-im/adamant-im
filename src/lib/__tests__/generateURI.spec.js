import { describe, expect, it } from 'vitest'

import { generateURI } from '@/lib/uri'
import { CryptosInfo } from '@/lib/constants'

/**
 * `generateURI` used to destructure `qrPrefix`, while the wallet specification spells the field
 * `qqPrefix`. The result was always `undefined`, so every non-ADM coin produced a bare address
 * instead of a payment URI and external wallets could not read the QR code.
 */
describe('generateURI', () => {
  it('prefixes a coin address with the scheme from the wallet specification', () => {
    const cases = [
      ['BTC', 'bitcoin', '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'],
      ['ETH', 'ethereum', '0x0000000000000000000000000000000000000000'],
      ['DASH', 'dash', 'XdAUuJ8Jrf5AR6mB2Bx9AWDHQKKMB7Nqfx'],
      ['DOGE', 'doge', 'DPQAKMS3zMBFHRXcgxDPdt5D2ExYZq2rFB']
    ]

    for (const [symbol, scheme, address] of cases) {
      expect(CryptosInfo[symbol].qqPrefix, `${symbol} spec`).toBe(scheme)
      expect(generateURI(symbol, address), symbol).toBe(`${scheme}:${address}`)
    }
  })

  it('returns a bare address for a coin the specification gives no scheme for', () => {
    const withoutScheme = Object.values(CryptosInfo).find((crypto) => !crypto.qqPrefix)

    if (!withoutScheme) return

    expect(generateURI(withoutScheme.symbol, 'ADDRESS')).toBe('ADDRESS')
  })
})
