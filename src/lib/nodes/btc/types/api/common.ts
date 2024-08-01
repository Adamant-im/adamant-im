export type RpcError = {
  code: number
  message: string
}

export type RpcResponse<T> =
  | {
      result: T
      error: null
      id: number | null
    }
  | {
      result: null
      error: RpcError
      id: number | null
    }

type Method =
  | 'getnetworkinfo'
  | 'getrawtransaction'
  | 'getaddresstxids'
  | 'getaddressutxos'
  | 'getaddressbalance'

export type RpcRequest<P = any, M extends Method | string = string> = {
  method: M
  params?: P
}
