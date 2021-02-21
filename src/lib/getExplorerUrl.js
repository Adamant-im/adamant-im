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
    case Cryptos.DOGE:
      return 'https://dogechain.info/tx/' + transactionId
    case Cryptos.DASH:
      return 'https://dashblockexplorer.com/tx/' + transactionId
    case Cryptos.BTC:
      return 'https://btc.com/' + transactionId
  }

  return ''
}
