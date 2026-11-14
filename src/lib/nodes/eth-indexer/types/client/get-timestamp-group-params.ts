export type GetTimestampGroupParams = {
  /**
   * ETH address
   */
  address: string
  /**
   * Number of decimals (for transfer amount formatting)
   */
  decimals: number
  /**
   * Exact block timestamp (seconds) of the group to read
   */
  time: number
  /**
   * ERC20 contract address
   */
  contract?: string
  /**
   * Limit the number of transactions returned. Defaults to `25`
   */
  limit?: number
  /**
   * Offset inside the group. Defaults to `0`
   */
  offset?: number
}
