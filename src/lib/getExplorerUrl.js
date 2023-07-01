import { Cryptos, CryptosInfo } from './constants'
import { explorerUriToOnion } from '@/lib/uri'

/**
 * Returns external transaction info explorer URL.
 *
 * @param {string} crypto like 'ADM' or 'ETH'
 * @param {string} transactionId ID (hash) of the transaction to explore
 * @returns {string} URL to the transaction details page
 */
export default function getExplorerUrl (crypto, transactionId) {
  let explorerUrl = CryptosInfo[crypto].explorerTx

  if (explorerUrl) {
    const data = { ID: transactionId }

    explorerUrl = explorerUrl.replace(/\${([a-zA-Z_]+?)}/g, (_, key) => data[key])
  }

  if (crypto === Cryptos.ADM) {
    return explorerUriToOnion(explorerUrl)
  }

  return explorerUrl || ''
}
