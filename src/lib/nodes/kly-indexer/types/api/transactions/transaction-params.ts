export type TransactionParams = {
  /**
   * Transaction ID to query
   */
  transactionID?: string
  /**
   * Combination of moduleName:commandName
   */
  moduleCommand?: string
  /**
   * Klayr account address
   */
  senderAddress?: string
  /**
   * Resolves for both senderAddress and recipientAddress
   */
  address?: string
  /**
   * Klayr account address.
   */
  recipientAddress?: string
  /**
   * Chain ID for the receiving chain in the case of cross-chain token transfers.
   */
  receivingChainID?: string
  /**
   * Block ID to query
   */
  blockID?: string
  /**
   * Query by height or a height range. Can be expressed as an interval i.e. `1:20` or `1:` or `:20`. Specified values are inclusive.
   */
  height?: string
  /**
   * Query by timestamp or a timestamp range. Can be expressed as an interval i.e. `1000000:2000000` or `1000000:` or `:2000000`. Specified values are inclusive.
   */
  timestamp?: string
  /**
   * Query transactions by their executionStatus.
   * Accepted values: pending, successful, failed.
   */
  executionStatus?: 'pending' | 'successful' | 'failed'
  /**
   * Query by nonce. Nonce is only allowed if senderAddress is supplied as a parameter.
   */
  nonce?: string
  /**
   * Limit to apply to the query results.
   */
  limit?: number
  /**
   * Offset to apply to the query results.
   */
  offset?: number
  /**
   * Fields to sort results by.
   */
  sort?: 'timestamp:asc' | 'timestamp:desc' | 'height:asc' | 'height:desc'
  /**
   * Fields to order results by. The order condition is applied after the sort condition, usually to break ties when the sort condition results in collision.
   */
  order?: 'index:asc' | 'index:desc'
}
