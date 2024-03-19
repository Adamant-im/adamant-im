import { convertBeddowsToLSK } from '@liskhq/lisk-transactions'
import { LSK_TOKEN_ID } from '@/lib/lisk'
import { RpcMethod, RpcResults } from './types/api'
import { LskNode } from './LskNode'
import { Client } from '../abstract.client'

export class LskClient extends Client<LskNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('lsk')
    this.nodes = endpoints.map((endpoint) => new LskNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  private async invoke<M extends RpcMethod>(
    method: M,
    params?: RpcResults[M]['params']
  ): Promise<RpcResults[M]['result']> {
    const node = this.getNode()

    return node.invoke(method, params)
  }

  /**
   * @param address LSK address (e.g.: "lskfan97j6phfdc3odtoorfabxdqtdymah55wnkk9")
   */
  async getNonce(address: string) {
    const { nonce } = await this.invoke('auth_getAuthAccount', { address })

    return nonce
  }

  /**
   * @param address LSK address (e.g.: "lskfan97j6phfdc3odtoorfabxdqtdymah55wnkk9")
   */
  async getBalance(address: string) {
    const { availableBalance } = await this.invoke('token_getBalance', {
      tokenID: LSK_TOKEN_ID,
      address
    })

    return Number(convertBeddowsToLSK(availableBalance))
  }

  async getHeight() {
    const { height } = await this.invoke('system_getNodeInfo')

    return height
  }

  async sendTransaction(transaction: string, dryRun?: boolean) {
    if (dryRun) {
      const result = await this.invoke('txpool_dryRunTransaction', { transaction })

      if ('errorMessage' in result) {
        throw new Error(result.errorMessage)
      }

      console.debug(`txpool_dryRunTransaction: Dry run transaction`, transaction, result)

      return 'debug_tx_id' // transactionId
    }

    const { transactionId } = await this.invoke('txpool_postTransaction', { transaction })
    return transactionId
  }
}
