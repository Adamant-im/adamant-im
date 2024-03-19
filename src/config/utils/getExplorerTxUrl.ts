import config from '../index'

/**
 * Returns external transaction info explorer URL.
 *
 * @param {string} crypto like 'adm' or 'eth'
 * @param {string} transactionId ID (hash) of the transaction to explorer
 * @returns {string} URL to the transaction details page
 */
export function getExplorerTxUrl(crypto: string, transactionId: string): string {
  const explorerUrl = config[crypto.toLowerCase()].explorerTx

  if (!explorerUrl) {
    return ''
  }

  const data = { ID: transactionId }
  return explorerUrl.replace(/\${([a-zA-Z_]+?)}/g, (_: string, key: keyof typeof data) => data[key])
}
