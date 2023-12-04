import data from './data.json'
import { TokenGeneral } from '@/types/wallets'

export type CryptoSymbol = keyof typeof data

export const CryptosInfo = data as unknown as Record<CryptoSymbol, TokenGeneral>

// Enum of supported cryptos
export const Cryptos = Object.values(CryptosInfo).reduce(
  (cryptos, crypto) => {
    if (crypto.defaultVisibility) {
      const symbol = crypto.symbol as CryptoSymbol

      cryptos[symbol] = symbol
    }

    return cryptos
  },
  {} as Record<CryptoSymbol, CryptoSymbol>
)

export const CryptosOrder = Object.values(Cryptos)
  .map((crypto) => CryptosInfo[crypto])
  .sort((a, b) => {
    if (a.defaultOrdinalLevel === undefined || b.defaultOrdinalLevel === undefined) {
      return 0
    }

    return a.defaultOrdinalLevel - b.defaultOrdinalLevel
  })
  .map((crypto) => crypto.symbol)
