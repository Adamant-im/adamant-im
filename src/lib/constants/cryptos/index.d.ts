import CryptosInfo from './data.json'

type CryptoSymbol = keyof typeof CryptosInfo

declare const Cryptos: Record<CryptoSymbol, CryptoSymbol>
declare const CryptosOrder: CryptoSymbol[]

export {
  CryptosInfo,
  CryptoSymbol,
  Cryptos,
  CryptosOrder
}
