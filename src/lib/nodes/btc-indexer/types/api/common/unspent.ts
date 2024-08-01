/**
 * In Bitcoin (BTC), UTXO stands for "Unspent Transaction Output."
 * It's a fundamental concept in the Bitcoin protocol that represents the
 * amount of Bitcoin that a user can spend.
 */
export type UTXO = {
  txid: string
  vout: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
  value: number
}
