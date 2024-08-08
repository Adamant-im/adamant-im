import { GetTransactionsRequest } from './get-transactions/get-transactions.request'
import { Transaction } from './get-transactions/transaction'

export type Endpoints = {
  /**
   * Get transactions
   */
  'GET /ethtxs': {
    params: GetTransactionsRequest
    result: Transaction[]
  }
  /**
   * Get max block number
   */
  'GET /max_block': {
    params: undefined
    result: [
      {
        max: number
        version: string
      }
    ]
  }
  /**
   * Check availability
   */
  'GET /aval': {
    params: undefined
    result: [
      {
        status: number
      }
    ]
  }
}
