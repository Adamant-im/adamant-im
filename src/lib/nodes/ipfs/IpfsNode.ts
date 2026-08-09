import utils from '@/lib/adamant'
import { NodeOfflineError } from '@/lib/nodes/utils/errors'
import axios, { AxiosInstance, AxiosProgressEvent, AxiosRequestConfig, ResponseType } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'

/** Matches the axios instance below, so a streamed download is not held to a stricter clock */
const DOWNLOAD_TIMEOUT_MS = 60 * 10 * 1000

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
    const { url, headers, method = 'get', payload, signal, onUploadProgress } = cfg
    const baseURL = this.getBaseURL(this)

    const config: AxiosRequestConfig = {
      baseURL,
      url,
      method: method.toLowerCase(),
      headers,
      // responseType: url.includes('file') ? 'arraybuffer' : 'json',
      [method === 'get' ? 'params' : 'data']:
        typeof payload === 'function' ? payload(this) : payload,
      responseType: cfg.responseType,
      signal,
      onUploadProgress
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
   * Downloads a file, refusing to hold more than `maxBytes` of it in memory.
   *
   * This does not go through axios. Both browser adapters route `onDownloadProgress` through
   * `progressEventReducer(..., true)`, which throttles to 3 Hz, and `responseType:
   * 'arraybuffer'` has XHR accumulate the body internally regardless — so by the time a
   * progress callback reports the overrun, the allocation this is meant to prevent has already
   * happened. Aborting from progress events bounds the *transfer*, not the memory.
   *
   * A streamed `fetch` gives the one guarantee that matters: each chunk is counted as it is
   * pulled, before it is retained, so the peak is the limit plus a single chunk.
   *
   * @throws {ResponseTooLargeError} as soon as the body exceeds `maxBytes`
   * @throws {NodeOfflineError} when the node cannot be reached
   */
  async downloadBounded(url: string, maxBytes: number, signal?: AbortSignal) {
    const controller = new AbortController()
    const abort = () => controller.abort()

    if (signal) {
      if (signal.aborted) abort()
      else signal.addEventListener('abort', abort, { once: true })
    }

    const timeout = setTimeout(abort, DOWNLOAD_TIMEOUT_MS)
    let exceeded = false

    try {
      const response = await fetch(new URL(url, this.getBaseURL(this)).toString(), {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Request to ${url} failed with status ${response.status}`)
      }

      // A declared length over the bound is refused before a single byte is read
      const declared = Number(response.headers.get('content-length'))

      if (Number.isFinite(declared) && declared > maxBytes) {
        exceeded = true
        abort()
        throw new ResponseTooLargeError(maxBytes)
      }

      if (!response.body) {
        // No streams here (jsdom, and any exotic runtime). Nothing can be bounded during the
        // transfer, so this is the old post-hoc check — correct, just later than we would like.
        const buffer = await response.arrayBuffer()

        if (buffer.byteLength > maxBytes) throw new ResponseTooLargeError(maxBytes)

        return buffer
      }

      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let received = 0

      for (;;) {
        const { done, value } = await reader.read()

        if (done) break
        if (!value) continue

        received += value.byteLength

        if (received > maxBytes) {
          exceeded = true
          // `cancel` releases the connection; the chunk that crossed the line is dropped
          void reader.cancel()
          abort()
          throw new ResponseTooLargeError(maxBytes)
        }

        chunks.push(value)
      }

      const body = new Uint8Array(received)
      let offset = 0

      for (const chunk of chunks) {
        body.set(chunk, offset)
        offset += chunk.byteLength
      }

      return body.buffer
    } catch (error) {
      if (exceeded || error instanceof ResponseTooLargeError) {
        // Deliberately not a NodeOfflineError: the node answered, it just answered with too
        // much. Marking it offline would rotate away from a node that is merely misbehaving.
        throw error instanceof ResponseTooLargeError ? error : new ResponseTooLargeError(maxBytes)
      }

      this.online = false
      throw new NodeOfflineError()
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', abort)
    }
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
