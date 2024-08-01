import { MultiSignatureKeys, NodeInfo } from '@/lib/klayr'

export type RpcResults = {
  system_getNodeInfo: {
    params: undefined
    result: NodeInfo
  }
  auth_getAuthAccount: {
    params: {
      /**
       * KLY address, e.g. "klyfan97j6phfdc3odtoorfabxdqtdymah55wnkk9"
       */
      address: string
    }
    result: MultiSignatureKeys & {
      /**
       * Nonce, numeric string
       */
      nonce: string
    }
  }
  token_getBalance: {
    params: {
      /**
       * Numeric string. Must be 16 chars length.
       *
       * ID of the KLY token: "0000000000000000"
       */
      tokenID: string
      /**
       * KLY address, e.g. "klyfan97j6phfdc3odtoorfabxdqtdymah55wnkk9"
       */
      address: string
    }
    result: {
      availableBalance: string
      lockedBalances: [] // not sure about type, it may be an array of string
    }
  }
  txpool_postTransaction: {
    params: {
      /**
       * Encoded transaction data
       */
      transaction: string
    }
    result: {
      transactionId: string
    }
  }
  txpool_dryRunTransaction: {
    params: {
      /**
       * Encoded transaction data
       */
      transaction: string
    }
    result:
      | {
          result: 1
          events: unknown[] // maybe type better
        }
      | {
          result: -1
          events: []
          errorMessage: string
        }
  }
}

export type RpcMethod = keyof RpcResults
