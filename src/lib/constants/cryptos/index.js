import CryptosInfo from './data.json'

// Enum of supported cryptos
export const Cryptos = Object.values(CryptosInfo).reduce((cryptos, crypto) => {
  if (crypto.defaultVisibility) {
    cryptos[crypto.symbol] = crypto.symbol
  }

  return cryptos
}, {})

export const CryptosOrder = Object.values(Cryptos)
  .map((crypto) => CryptosInfo[crypto])
  .sort((a, b) => a.defaultOrdinalLevel - b.defaultOrdinalLevel)
  .map((crypto) => crypto.symbol)

export { CryptosInfo }
