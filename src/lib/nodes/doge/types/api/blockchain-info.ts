type SoftforkReject = {
  status: boolean
  found?: number
  required?: number
  window?: number
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
  pruned: boolean
  softforks: Softfork[]
  bip9_softforks: Record<string, Bip9Softfork>
}
