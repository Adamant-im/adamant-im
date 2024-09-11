type SoftforkBip9 = {
  status: string
  start_time: number
  timeout: number
  ehf: boolean
  since: number
}

type Softfork = {
  type: string
  active: boolean
  height?: number
  bip9?: SoftforkBip9
}

export type BlockchainInfo = {
  chain: string
  blocks: number
  headers: number
  bestblockhash: string
  difficulty: number
  mediantime: number
  verificationprogress: number
  initialblockdownload: boolean
  chainwork: string
  size_on_disk: number
  pruned: boolean
  softforks: Record<string, Softfork>
  warnings: string
}
