export type NodeStatus = {
  info: {
    version: number
    protocolversion: number
    blocks: number
    timeoffset: number
    connections: number
    proxy: string
    difficulty: number
    testnet: boolean
    paytxfee: number
    relayfee: number
    errors: string
  }
}
