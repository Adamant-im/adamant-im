// Unspent transaction outputs (UTXOs) of a Dogecoin address.
export type UTXO = {
  address: string
  txid: string
  vout: number
  ts: number
  scriptPubKey: string
  amount: number
  confirmations: number
  confirmationsFromCache: boolean
}

export type GetUnspentsParams = {
  noCache?: 0 | 1
}
