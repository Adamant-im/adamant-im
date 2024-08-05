import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { formatDogeVersion } from '@/lib/nodes/utils/nodeVersionFormatters'
import { RpcRequest, RpcResponse } from './types/api/common'
import { NetworkInfo } from './types/api/network-info'
import { BlockchainInfo } from './types/api/blockchain-info'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class DogeNode extends Node<AxiosInstance> {
  constructor(url: string) {
    super(url, 'doge', 'node', NODE_LABELS.DogeNode)
  }

  protected buildClient(): AxiosInstance {
    return createBtcLikeClient(this.url)
  }

  protected async checkHealth() {
    const time = Date.now()

    const { blocks } = await this.invoke<BlockchainInfo>({
      method: 'getblockchaininfo',
      params: []
    })

    return {
      height: Number(blocks),
      ping: Date.now() - time
    }
  }

  protected async fetchNodeVersion(): Promise<void> {
    const { version } = await this.invoke<NetworkInfo>({
      method: 'getnetworkinfo',
      params: []
    })

    if (version) {
      this.version = formatDogeVersion(version)
    }
  }

  /**
   * Performs a request to the Doge node.
   */
  async invoke<Response = any, Request extends RpcRequest = RpcRequest>(
    params?: Request,
    requestConfig?: AxiosRequestConfig
  ): Promise<Response> {
    return this.client
      .request<RpcResponse<Response>>({
        ...requestConfig,
        url: '/',
        method: 'POST',
        data: params
      })
      .then((res) => res.data)
      .then(({ result, error }) => {
        if (error) throw new Error(error.message)

        return result
      })
  }
}
