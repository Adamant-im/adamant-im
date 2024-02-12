export type GetTransactionsParams = {
  /**
   * ETH address
   */
  address: string
  /**
   * Number of decimals (for transfer amount formatting)
   */
  decimals: number
  /**
   * ERC20 contract address
   */
  contract?: string
  /**
   * Start block number
   */
  from?: number
  /**
   * Up to block number
   */
  to?: number
  /**
   * Limit the number of transactions returned. Default to `100`
   */
  limit?: number
  /**
   * Offset. Defaults to `0`
   */
  offset?: number
}
