import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { RpcRequest, RpcResponse } from './types/api/common'

type FetchNodeVersionResponse = {
  error: string
  result: {
    buildversion: string
  }
}

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class DashNode extends Node<AxiosInstance> {
  constructor(url: string) {
    super(url, 'dash', 'node', NODE_LABELS.DashNode)
  }

  protected buildClient(): AxiosInstance {
    return createBtcLikeClient(this.url)
  }

  protected async checkHealth() {
    const time = Date.now()
    const height = await this.client
      .post('/', {
        method: 'getblockchaininfo'
      })
      .then((res) => res.data.result.blocks)

    return {
      height,
      ping: Date.now() - time
    }
  }

  protected async fetchNodeVersion(): Promise<void> {
    const { data } = await this.client.post<FetchNodeVersionResponse>('/', {
      method: 'getnetworkinfo'
    })
    const { buildversion } = data.result
    if (buildversion) {
      this.version = buildversion.replace('v', '')
    }
  }

  /**
   * Performs an RPC request to the Dash node.
   */
  async invoke<Result = any, Request extends RpcRequest = RpcRequest>(
    params: Request,
    requestConfig?: AxiosRequestConfig
  ): Promise<Result> {
    return this.client
      .request<RpcResponse<Result>>({
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

  /**
   * Performs many RPC requests to the Dash node.
   */
  async invokeMany<Result = any, Request extends RpcRequest = RpcRequest>(
    params: Request[],
    requestConfig?: AxiosRequestConfig
  ): Promise<RpcResponse<Result>[]> {
    return this.client
      .request<RpcResponse<Result>[]>({
        ...requestConfig,
        url: '/',
        method: 'POST',
        data: params
      })
      .then((res) => res.data)
  }
}
