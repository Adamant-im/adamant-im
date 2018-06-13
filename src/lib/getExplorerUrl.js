import { Cryptos } from './constants'

/**
 * Returns external transaction info explorer URL.
 *
 * @param {string} crypto one of 'ADM' or 'ETH'
 * @param {string} transactionId ID (hash) of the transaction to explore
 * @returns {string} URL to the transaction details page
 */
export default function getExplorerUrl (crypto, transactionId) {
  switch (crypto) {
    case Cryptos.ADM:
      return 'https://explorer.adamant.im/tx/' + transactionId
    case Cryptos.ETH:
      return 'https://etherscan.io/tx/' + transactionId
  }

  return ''
}
