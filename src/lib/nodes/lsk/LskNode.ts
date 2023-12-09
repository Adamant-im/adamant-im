import axios, { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { RpcMethod, RpcResults } from './types/api'
import { JSONRPCResponse } from '@/lib/lisk'
import { v4 as uuid } from 'uuid'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class LskNode extends Node {
  client: AxiosInstance

  constructor(url: string) {
    super(url, NODE_LABELS.LskNode)

    this.client = axios.create({ baseURL: url })

    // Don't fetch node info if user disabled it
    if (this.active) {
      void this.fetchNodeInfo()
    }
    void this.startHealthcheck()
  }

  /**
   * Performs an RPC request to the Lisk node.
   *
   * @docs https://lisk.com/documentation/beta/api/lisk-node-rpc.html
   */
  async invoke<M extends RpcMethod>(
    method: M,
    params?: RpcResults[M]['params']
  ): Promise<RpcResults[M]['result']> {
    return this.client
      .post<JSONRPCResponse<RpcResults[M]['result']>>('/rpc', {
        jsonrpc: '2.0',
        id: uuid(),
        method,
        params
      })
      .then((res) => {
        const { error, result } = res.data

        if (error) {
          throw new Error(error.message, { cause: error.code }) // @todo lisk api error
        }

        return result!
      })
  }

  private async fetchNodeInfo(): Promise<{ version: string; height: number }> {
    const { version, height } = await this.invoke('system_getNodeInfo')
    this.version = version
    this.height = height

    return {
      version,
      height
    }
  }

  protected async checkHealth() {
    const time = Date.now()
    const { height } = await this.invoke('system_getNodeInfo')

    return {
      height,
      ping: Date.now() - time
    }
  }
}
