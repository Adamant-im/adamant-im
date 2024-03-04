import data from './data.json'
import { TokenGeneral } from '@/types/wallets'

export type CryptoSymbol = keyof typeof data

export const CryptosInfo = data as unknown as Record<CryptoSymbol, TokenGeneral>

// Enum of all cryptos
export const AllCryptos = Object.values(CryptosInfo).reduce(
  (cryptos, { symbol }) => {
    return { [symbol]: symbol, ...cryptos }
  },
  {} as Record<CryptoSymbol, CryptoSymbol>
)

export const AllCryptosOrder: CryptoSymbol[] = Object.values(AllCryptos)
  .map((crypto) => CryptosInfo[crypto])
  .sort((a, b) => {
    if (a.defaultVisibility === undefined && b.defaultVisibility === undefined) {
      return 1
    }

    return a.defaultVisibility === b.defaultVisibility ? 0 : a.defaultVisibility ? -1 : 1
  })
  .sort((a, b) => {
    if (a.defaultOrdinalLevel === undefined || b.defaultOrdinalLevel === undefined) {
      return 0
    }

    return a.defaultOrdinalLevel - b.defaultOrdinalLevel
  })
  .map((crypto) => crypto.symbol as CryptoSymbol)

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
