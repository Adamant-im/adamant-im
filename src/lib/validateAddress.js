import { isAddress, isHexStrict } from 'web3-utils'
import { isValidAddress as isValidBtcAddress } from './bitcoin/bitcoin-utils'
import {
  Cryptos, isErc20,
  RE_ADM_ADDRESS, RE_DASH_ADDRESS, RE_DOGE_ADDRESS, RE_LSK_ADDRESS
} from './constants'

/**
 * Checks if `address` is a valid address for the specified `crypto`.
 *
 * @param {string} crypto like 'ADM' or 'ETH'
 * @param {string} address value to check
 * @returns {boolean} `true` if address is valid, `false` otherwise
 */
export default function validateAddress (crypto, address) {
  if (crypto === Cryptos.ADM) {
    return RE_ADM_ADDRESS.test(address)
  } else if (crypto === Cryptos.ETH || isErc20(crypto)) {
    return isHexStrict(address) && isAddress(address)
  } else if (crypto === Cryptos.DOGE) {
    return RE_DOGE_ADDRESS.test(address)
  } else if (crypto === Cryptos.DASH) {
    return RE_DASH_ADDRESS.test(address)
  } else if (crypto === Cryptos.LSK) {
    return RE_LSK_ADDRESS.test(address)
  } else if (crypto === Cryptos.BTC) {
    return isValidBtcAddress(address)
  }
  return true
}
