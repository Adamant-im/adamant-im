type SoftforkReject = {
  status: boolean
}

type Softfork = {
  id: string
  version: number
  reject: SoftforkReject
}

type Bip9Softfork = {
  status: string
  startTime: number
  timeout: number
  since: number
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
  softforks: Softfork[]
  bip9_softforks: Record<string, Bip9Softfork>
  warnings: string
}
