type ScriptSig = {
  asm: string
  hex: string
}

type Vin = {
  txid: string
  vout: number
  scriptSig: ScriptSig
  value: number
  valueSat: number
  address: string
  sequence: number
}

type ScriptPubKey = {
  asm: string
  hex: string
  reqSigs: number
  type: string
  addresses: string[]
}

type Vout = {
  value: number
  valueSat: number
  n: number
  scriptPubKey: ScriptPubKey
  spentTxId: string
  spentIndex: number
  spentHeight: number
}

export type Transaction = {
  txid: string
  version: number
  type: number
  size: number
  locktime: number
  vin: Vin[]
  vout: Vout[]
  hex: string
  blockhash: string
  height: number
  confirmations: number
  time: number
  blocktime: number
  instantlock: boolean
  instantlock_internal: boolean
  chainlock: boolean
}
