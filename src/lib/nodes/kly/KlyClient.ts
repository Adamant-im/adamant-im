import { convertBeddowsToKLY } from '@klayr/transactions'
import { KLY_TOKEN_ID } from '@/lib/klayr'
import { RpcMethod, RpcResults } from './types/api'
import { KlyNode } from './KlyNode'
import { Client } from '../abstract.client'

export class KlyClient extends Client<KlyNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('kly')
    this.nodes = endpoints.map((endpoint) => new KlyNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  private async invoke<M extends RpcMethod>(
    method: M,
    params?: RpcResults[M]['params']
  ): Promise<RpcResults[M]['result']> {
    const node = this.useFastest ? this.getFastestNode() : this.getRandomNode()
    if (!node) {
      // All nodes seem to be offline: let's refresh the statuses
      this.checkHealth()
      // But there's nothing we can do right now
      throw new Error('No online nodes at the moment')
    }

    return node.invoke(method, params)
  }

  /**
   * @param address KLY address (e.g.: "klyfan97j6phfdc3odtoorfabxdqtdymah55wnkk9")
   */
  async getNonce(address: string) {
    const { nonce } = await this.invoke('auth_getAuthAccount', { address })

    return nonce
  }

  /**
   * @param address KLY address (e.g.: "klyfan97j6phfdc3odtoorfabxdqtdymah55wnkk9")
   */
  async getBalance(address: string) {
    const { availableBalance } = await this.invoke('token_getBalance', {
      tokenID: KLY_TOKEN_ID,
      address
    })

    return Number(convertBeddowsToKLY(availableBalance))
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
