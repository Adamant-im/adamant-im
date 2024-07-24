import { Cryptos, isErc20, CryptosInfo } from '@/lib/constants'

/** Pending transaction may be not known to blockchain yet */

/** Interval (ms) between attempts to fetch an registered transaction, when InstantSend is possible */
export const INSTANT_SEND_INTERVAL = 4 * 1000
/** Time (ms) to consider InstantSend is yet possible */
export const INSTANT_SEND_TIME = 60 * 1000
/** Will be used if the coin doesn't provide `txFetchInfo` in `adamant-wallets` **/
export const DEFAULT_TX_FETCH_INTERVAL = 10000
export const DEFAULT_TX_FETCH_ATTEMPTS = 5

export const getTxFetchInfo = (crypto) => {
  const chain = isErc20(crypto) ? Cryptos.ETH : crypto
  const txFetchInfo = CryptosInfo[chain].txFetchInfo

  return {
    newPendingInterval: txFetchInfo?.newPendingInterval || DEFAULT_TX_FETCH_INTERVAL,
    oldPendingInterval: txFetchInfo?.oldPendingInterval || DEFAULT_TX_FETCH_INTERVAL,
    registeredInterval: txFetchInfo?.registeredInterval || DEFAULT_TX_FETCH_INTERVAL,
    newPendingAttempts: txFetchInfo?.newPendingAttempts || DEFAULT_TX_FETCH_ATTEMPTS,
    oldPendingAttempts: txFetchInfo?.oldPendingAttempts || DEFAULT_TX_FETCH_ATTEMPTS
  }
}
