type ChainStats = {
  funded_txo_count: number
  funded_txo_sum: number
  spent_txo_count: number
  spent_txo_sum: number
  tx_count: number
}

type MempoolStats = {
  funded_txo_count: number
  funded_txo_sum: number
  spent_txo_count: number
  spent_txo_sum: number
  tx_count: number
}

export type GetAddressResult = {
  address: string
  chain_stats: ChainStats
  mempool_stats: MempoolStats
}
