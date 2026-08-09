import utils from '@/lib/adamant'
import { NodeOfflineError } from '@/lib/nodes/utils/errors'
import axios, { AxiosInstance, AxiosProgressEvent, AxiosRequestConfig, ResponseType } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'

type FetchNodeInfoResult = {
  availableSizeInMb: number
  blockstoreSizeMb: number
  datastoreSizeMb: number
  heliaStatus: string
  timestamp: number
  version: string
}

export type Payload =
  | Record<string, any>
  | {
      (ctx: IpfsNode): Record<string, any>
    }
export type RequestConfig<P extends Payload> = {
  url: string
  headers?: Record<string, string>
  method?: string
  payload?: P
  onUploadProgress?: (progress: AxiosProgressEvent) => void
  responseType?: ResponseType
  signal?: AbortSignal
  /** Abort the transfer once the response exceeds this many bytes. See `enforceSizeLimit`. */
  maxContentLength?: number
}

/** Raised when a response is cut short for exceeding its declared size */
export class ResponseTooLargeError extends Error {
  constructor(limit: number) {
    super(`Response exceeds the allowed size of ${limit} bytes`)
    this.name = 'ResponseTooLargeError'
  }
}

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class IpfsNode extends Node<AxiosInstance> {
  constructor(endpoint: NodeInfo, minNodeVersion = '0.0.0') {
    super(endpoint, 'ipfs', 'node', NODE_LABELS.IpfsNode, '', minNodeVersion)
  }

  protected buildClient(): AxiosInstance {
    return axios.create({
      baseURL: this.url,
      timeout: 60 * 10 * 1000
    })
  }

  /**
   * Performs an API request.
   *
   * The `payload` of the `cfg` can be either an object or a function that
   * accepts `ApiNode` as a first argument and returns an object.
   */
  request<P extends Payload = Payload, R = any>(cfg: RequestConfig<P>): Promise<R> {
    const {
      url,
      headers,
      method = 'get',
      payload,
      signal,
      onUploadProgress,
      maxContentLength
    } = cfg
    const baseURL = this.getBaseURL(this)
    const limit = this.enforceSizeLimit(maxContentLength, signal)

    const config: AxiosRequestConfig = {
      baseURL,
      url,
      method: method.toLowerCase(),
      headers,
      // responseType: url.includes('file') ? 'arraybuffer' : 'json',
      [method === 'get' ? 'params' : 'data']:
        typeof payload === 'function' ? payload(this) : payload,
      responseType: cfg.responseType,
      signal: limit ? limit.signal : signal,
      onUploadProgress,
      ...(limit ? { onDownloadProgress: limit.onDownloadProgress } : {}),
      // Honoured only by the Node adapter, which is what the tests and the Electron main
      // process use. The browser adapters ignore it entirely — hence the progress-based abort.
      ...(typeof maxContentLength === 'number' ? { maxContentLength } : {})
    }

    return this.client.request(config).then(
      (response) => {
        const body = response.data
        // Refresh time delta on each request
        if (body && isFinite(body.nodeTimestamp)) {
          this.timeDelta = utils.epochTime() - body.nodeTimestamp
        }

        return body
      },
      (error) => {
        // Checked before the offline branch: an oversized answer means the node responded, and
        // marking it offline would rotate away from a node that is merely misbehaving here.
        if (limit?.exceeded) {
          throw new ResponseTooLargeError(limit.max)
        }

        // According to https://github.com/axios/axios#handling-errors this means, that request was sent,
        // but server could not respond.
        if (!error.response && error.request) {
          this.online = false
          throw new NodeOfflineError()
        }
        throw error
      }
    )
  }

  /**
   * Bounds a response by aborting the transfer, rather than by inspecting it afterwards.
   *
   * axios only implements `maxContentLength` in its Node adapter (`lib/adapters/http.js`); the
   * XHR and fetch adapters used by the PWA and the Electron renderer ignore it. In those
   * environments the option alone leaves a hostile node free to stream an unbounded body into
   * memory, and the size check afterwards is far too late. Download progress is reported by
   * every adapter, so the limit is enforced from there and the request is aborted through an
   * `AbortController`.
   *
   * @returns `undefined` when no limit applies
   */
  private enforceSizeLimit(maxContentLength: number | undefined, externalSignal?: AbortSignal) {
    if (typeof maxContentLength !== 'number' || maxContentLength < 0) return undefined

    const controller = new AbortController()
    const state = {
      max: maxContentLength,
      exceeded: false,
      signal: controller.signal,
      onDownloadProgress: (progress: AxiosProgressEvent) => {
        // `total` comes from Content-Length when the node sends one, which lets an oversized
        // body be rejected before its first chunk is kept.
        const announced = Math.max(progress.loaded ?? 0, progress.total ?? 0)

        if (state.exceeded || announced <= maxContentLength) return

        state.exceeded = true
        controller.abort()
      }
    }

    // An abort requested by the caller still has to reach the request
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort()
      else externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    return state
  }

  /**
   * Fetch node version, block height and ping.
   * @returns {Promise<{version: string, height: number, ping: number}>}
   */
  private async fetchNodeInfo(): Promise<FetchNodeInfoResult> {
    const {
      availableSizeInMb,
      blockstoreSizeMb,
      datastoreSizeMb,
      heliaStatus,
      timestamp,
      version
    } = await this.request<Payload, FetchNodeInfoResult>({
      url: '/api/node/info'
    })

    this.version = version
    this.height = timestamp

    return {
      availableSizeInMb,
      blockstoreSizeMb,
      datastoreSizeMb,
      heliaStatus,
      timestamp,
      version
    }
  }

  protected async checkHealth() {
    const time = Date.now()
    const { timestamp } = await this.fetchNodeInfo()
    this.height = timestamp

    return {
      height: this.height,
      ping: Date.now() - time
    }
  }

  formatHeight(height: number): string {
    return super.formatHeight(
      Number(
        Math.ceil(height / 1000)
          .toString()
          .substring(2)
      )
    )
  }
}
