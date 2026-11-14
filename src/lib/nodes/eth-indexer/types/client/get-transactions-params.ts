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
   * Limit the number of transactions returned. Defaults to `25`
   */
  limit?: number
  /**
   * Offset. Defaults to `0`
   */
  offset?: number
  /**
   * Sort order of the `time` column. Defaults to `time.desc` (newest first).
   * Use `time.asc` to page forward from a known lower boundary without
   * skipping anything in between
   */
  order?: 'time.asc' | 'time.desc'
}
