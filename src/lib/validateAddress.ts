import { isAddress as isEthAddress, isHexStrict } from 'web3-validator'
import { isValidAddress as isValidBtcAddress } from './bitcoin/bitcoin-utils'
import { Cryptos, CryptosInfo, CryptoSymbol, isEthBased } from './constants'

/**
 * Checks address validity for a specified `crypto`.
 *
 * @param crypto - like 'ADM' or 'ETH'
 * @param address - value to check
 * @returns Returns `true` if address is valid, `false` otherwise
 */
export default function validateAddress(crypto: CryptoSymbol, address: string) {
  if (isEthBased(crypto)) {
    return isHexStrict(address) && isEthAddress(address)
  }

  if (crypto === Cryptos.BTC) {
    return isValidBtcAddress(address)
  }

  for (const [symbol, { regexAddress }] of Object.entries(CryptosInfo)) {
    if (crypto === symbol && regexAddress) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- Safe: regexAddress is a static pattern from CryptosInfo config, not user input
      return new RegExp(regexAddress).test(address)
    }
  }

  return true
}
