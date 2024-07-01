import axios, { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { RpcMethod, RpcResults } from './types/api'
import { JSONRPCResponse } from '@/lib/klayr'
import { v4 as uuid } from 'uuid'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class KlyNode extends Node<AxiosInstance> {
  constructor(url: string) {
    super(url, 'kly', 'node', NODE_LABELS.KlyNode)
  }

  protected buildClient(): AxiosInstance {
    return axios.create({ baseURL: this.url })
  }

  /**
   * Performs an RPC request to the Klayr node.
   *
   * @docs https://klayr.xyz/documentation/beta/api/lisk-node-rpc.html
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
          throw new Error(error.message, { cause: error.code })
        }

        return result!
      })
  }

  protected async checkHealth() {
    const time = Date.now()
    const { height, version } = await this.invoke('system_getNodeInfo')
    this.version = version

    return {
      height,
      ping: Date.now() - time
    }
  }
}
