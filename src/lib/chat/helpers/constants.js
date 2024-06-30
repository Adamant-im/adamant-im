import { Cryptos } from '@/lib/constants'

/**
 * Maps crypto transfer transaction types to the respective cryptos.
 * E.g.:
 *
 * ```
 * {
 *   'eth_transaction': 'ETH',
 *   'bnb_transaction': 'BNB'
 * }
 * ```
 */
export const KnownCryptos = Object.keys(Cryptos).reduce((map, crypto) => {
  if (crypto !== Cryptos.ADM) {
    const key = `${crypto.toLowerCase()}_transaction`
    map[key] = crypto
  }
  return map
}, {})

/** Cryptos, supported by other clients, but not PWA */
export const UnsupportedCryptos = {
  kly_transaction: 'KLY'
}
