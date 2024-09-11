import { GetTransactionsParams } from './get-transactions/get-transactions-params'
import { GetTransactionParams } from './get-transaction/get-transaction-params'
import { GetUnspentsParams } from './get-unspents/get-unspents-params'
import { GetAddressParams } from './get-address/get-address-params'
import { GetAddressResult } from './get-address/get-address-result'
import { Transaction } from './common/transaction'
import { UTXO } from './common/unspent'

export type Endpoints = {
  'GET /address/${address}': {
    params: GetAddressParams
    result: GetAddressResult
  }

  /**
   * Query transactions history
   */
  'GET /address/${address}/txs': {
    params?: GetTransactionsParams
    result: Transaction[]
  }

  /**
   * Get transaction details
   */
  'GET /tx/${transactionId}': {
    params?: GetTransactionParams
    result: Transaction
  }

  /**
   * Get transaction details in HEX format
   * The result is a plain text string with Content-Type: text/plain
   *
   * @example 010000000241a5ca1ec67298a07dd29b877cd1a4f41f2b1461e95ff5f50356e7fa2be833b6010000006b48304502210093b861c66b58421a4f7d7845bf9d9b910b996c5ee8b854ef4b38a2ec4d7953f4022077414a3923b15d51713775a827ff927fe9a084756118e8d383de6ea0d7e56a740121037ec9f6126013088b3d1e8f844f3e755144756a4e9a7da6b0094c189f55031934ffffffffc0c144785949b37bf8cd89d799a0d63da4789eaff9fb426b9c8b449c6c3aedec000000006b483045022100f359a7a1294f7f9aea7f36f6688486b5327ddfaae40d1121925e85615ceaddc402206b3e02270ab976c336fc0729b8d14cbcc25cfbd848fe2d9da43833ae1b8d5bd00121037ec9f6126013088b3d1e8f844f3e755144756a4e9a7da6b0094c189f55031934ffffffff02e8030000000000001976a914389718822b54723a1d7d1a6f8163a2eae1da2a8688acadd90200000000001976a914931ef5cbdad28723ba9596de5da1145ae969a71888ac00000000
   */
  'GET /tx/${transactionId}/hex': {
    params?: {
      transactionId: string
    }
    result: string
  }

  'GET /address/${address}/utxo': {
    params?: GetUnspentsParams
    result: UTXO[]
  }

  'GET /fee-estimates': {
    params: undefined
    result: Record<string, number>
  }

  /**
   * Get the current block height
   */
  'GET /blocks/tip/height': {
    params: undefined
    result: string // Content-type is text/plain. Need to be parsed as a number.
  }

  /**
   * Send signed transaction to the network
   */
  'POST /tx': {
    params: {
      /**
       * HEX-encoded transaction
       */
      txHex: string
    }
    result: unknown
  }
}
