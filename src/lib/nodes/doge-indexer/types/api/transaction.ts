type ScriptSig = {
  asm: string
  hex: string
}

type Vin = {
  txid: string
  vout: number
  scriptSig: ScriptSig
  sequence: number
  n: number
  addr: string
  valueSat: number
  value: number
  doubleSpentTxID: string | null
  isConfirmed: boolean
  confirmations: number
  unconfirmedInput: boolean
}

type ScriptPubKey = {
  asm: string
  hex: string
  reqSigs: number
  type: string
  addresses: string[]
}

type Vout = {
  value: string
  n: number
  scriptPubKey: ScriptPubKey
}

export type Transaction = {
  txid: string
  hash: string
  size: number
  vsize: number
  version: number
  locktime: number
  vin: Vin[]
  vout: Vout[]
  blockhash: string
  confirmations: number
  time: number
  blocktime: number
  valueOut: number
  valueIn: number
  fees: number
}

export type GetTransactionsParams = {
  from?: number
  to?: number
}
