import { isAddress as isEthAddress, isHexStrict } from 'web3-utils'
import { isValidAddress as isValidBtcAddress } from './bitcoin/bitcoin-utils'
import { validateBase32Address as isLskAddress } from '@liskhq/lisk-cryptography'
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
    return isHexStrict(address) && isEthAddress(address)
  } else if (crypto === Cryptos.DOGE) {
    return RE_DOGE_ADDRESS.test(address)
  } else if (crypto === Cryptos.DASH) {
    return RE_DASH_ADDRESS.test(address)
  } else if (crypto === Cryptos.LSK) {
    // We need to use try-catch https://github.com/LiskHQ/lisk-sdk/issues/6652
    try {
      if (RE_LSK_ADDRESS.test(address) && isLskAddress(address)) {
        return true
      }
    } catch (e) { }
    return false
  } else if (crypto === Cryptos.BTC) {
    return isValidBtcAddress(address)
  }
  return true
}
