import { describe, expect, it, vi } from 'vitest'
import type { AxiosRequestConfig } from 'axios'

import { IpfsNode, ResponseTooLargeError } from '../IpfsNode'

/**
 * Transport-level cover for the attachment download bound.
 *
 * The point being proved is that the request is cut off *while* it is arriving. axios only
 * honours `maxContentLength` in its Node adapter, so asserting on that option alone would pass
 * while the PWA and the Electron renderer still buffered an unbounded body.
 */
const buildNode = () => {
  const node = new IpfsNode({ url: 'https://ipfs.example', alt_ip: undefined } as never, '0.0.0')

  const request = vi.fn()
  // `client` is created lazily by the base class; the transport is the thing under test here
  Object.defineProperty(node, 'client', { value: { request }, writable: true })

  return { node, request }
}

const capturedConfig = (request: ReturnType<typeof vi.fn>): AxiosRequestConfig =>
  request.mock.calls[0][0]

describe('IpfsNode download size limit', () => {
  it('aborts as soon as the received bytes pass the limit', async () => {
    const { node, request } = buildNode()
    let aborted = false

    request.mockImplementation((config: AxiosRequestConfig) => {
      config.signal?.addEventListener?.('abort', () => {
        aborted = true
      })

      // Two chunks below the limit, then one that crosses it
      config.onDownloadProgress?.({ loaded: 400, total: undefined } as never)
      config.onDownloadProgress?.({ loaded: 900, total: undefined } as never)
      expect(aborted, 'aborted before the limit was reached').toBe(false)

      config.onDownloadProgress?.({ loaded: 1400, total: undefined } as never)

      return Promise.reject(Object.assign(new Error('canceled'), { request: {} }))
    })

    await expect(
      node.request({ url: 'api/file/cid', responseType: 'arraybuffer', maxContentLength: 1000 })
    ).rejects.toBeInstanceOf(ResponseTooLargeError)

    expect(aborted).toBe(true)
  })

  it('rejects on the declared Content-Length before any chunk is kept', async () => {
    const { node, request } = buildNode()
    let loadedWhenAborted: number | undefined

    request.mockImplementation((config: AxiosRequestConfig) => {
      config.signal?.addEventListener?.('abort', () => {
        loadedWhenAborted = 0
      })

      // First progress event of a response that announces far more than allowed
      config.onDownloadProgress?.({ loaded: 0, total: 50_000_000 } as never)

      return Promise.reject(Object.assign(new Error('canceled'), { request: {} }))
    })

    await expect(
      node.request({ url: 'api/file/cid', responseType: 'arraybuffer', maxContentLength: 1000 })
    ).rejects.toBeInstanceOf(ResponseTooLargeError)

    expect(loadedWhenAborted).toBe(0)
  })

  it('reports an oversized answer as such, not as an offline node', async () => {
    const { node, request } = buildNode()

    request.mockImplementation((config: AxiosRequestConfig) => {
      config.onDownloadProgress?.({ loaded: 2000, total: undefined } as never)

      // Shape axios produces for a canceled request: no response, but a request was made.
      // Without the size check this is indistinguishable from an unreachable node.
      return Promise.reject(Object.assign(new Error('canceled'), { request: {} }))
    })

    await expect(
      node.request({ url: 'api/file/cid', maxContentLength: 1000 })
    ).rejects.toBeInstanceOf(ResponseTooLargeError)

    expect(node.online, 'an oversized response must not take the node offline').not.toBe(false)
  })

  it('still passes maxContentLength for the Node adapter', async () => {
    const { node, request } = buildNode()
    request.mockResolvedValue({ data: new ArrayBuffer(8) })

    await node.request({ url: 'api/file/cid', maxContentLength: 1000 })

    expect(capturedConfig(request).maxContentLength).toBe(1000)
  })

  it('leaves requests without a limit untouched', async () => {
    const { node, request } = buildNode()
    request.mockResolvedValue({ data: {} })

    await node.request({ url: 'api/node/info' })

    const config = capturedConfig(request)
    expect(config.maxContentLength).toBeUndefined()
    expect(config.onDownloadProgress).toBeUndefined()
  })

  it("honours the caller's own abort signal", async () => {
    const { node, request } = buildNode()
    const external = new AbortController()
    let aborted = false

    request.mockImplementation((config: AxiosRequestConfig) => {
      config.signal?.addEventListener?.('abort', () => {
        aborted = true
      })
      external.abort()

      return Promise.reject(Object.assign(new Error('canceled'), { request: {} }))
    })

    await expect(
      node.request({ url: 'api/file/cid', maxContentLength: 1000, signal: external.signal })
    ).rejects.toBeInstanceOf(Error)

    expect(aborted, 'wrapping the signal must not detach the caller from the request').toBe(true)
  })
})
