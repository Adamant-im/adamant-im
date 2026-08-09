import { afterEach, describe, expect, it, vi } from 'vitest'

import { IpfsNode, ResponseTooLargeError } from '../IpfsNode'
import { NodeOfflineError } from '@/lib/nodes/utils/errors'

/**
 * Transport-level cover for the attachment download bound.
 *
 * An earlier revision enforced the bound from `onDownloadProgress` and tested it by invoking
 * that callback directly. That proved nothing about production: axios routes browser download
 * events through `progressEventReducer(..., true)`, which throttles to 3 Hz, and
 * `responseType: 'arraybuffer'` has XHR buffer the body internally anyway — so the allocation
 * had already happened by the time the callback fired.
 *
 * These tests drive the real reader loop with a chunked body and no `Content-Length`, and
 * assert on how much was ever pulled from the stream, which is the quantity that bounds memory.
 */
const CHUNK = 64 * 1024

const buildNode = () =>
  new IpfsNode({ url: 'https://ipfs.example', alt_ip: undefined } as never, '0.0.0')

/**
 * A response whose body arrives in chunks, counting how many bytes the consumer actually pulled
 * and whether the stream was cancelled.
 */
const chunkedResponse = (totalBytes: number, headers: Record<string, string> = {}) => {
  const state = { pulled: 0, cancelled: false }
  let remaining = totalBytes

  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (remaining <= 0) {
          controller.close()
          return
        }

        const size = Math.min(CHUNK, remaining)
        remaining -= size
        state.pulled += size
        controller.enqueue(new Uint8Array(size))
      },
      cancel() {
        state.cancelled = true
      }
    },
    // No read-ahead, so `pulled` counts exactly what the code under test asked for. A real
    // response also buffers a little inside the transport; that is a constant on top of the
    // bound, not something that grows with what the node sends.
    { highWaterMark: 0 }
  )

  const response = {
    ok: true,
    status: 200,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    body,
    arrayBuffer: async () => new ArrayBuffer(totalBytes)
  }

  return { response, state }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('IpfsNode.downloadBounded', () => {
  it('stops pulling from the stream once the bound is crossed', async () => {
    const limit = 1024 * 1024
    // A node that answers with 64 MiB to a request bounded at 1 MiB, and declares no length
    const { response, state } = chunkedResponse(64 * 1024 * 1024)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    await expect(buildNode().downloadBounded('api/file/cid', limit)).rejects.toBeInstanceOf(
      ResponseTooLargeError
    )

    // The whole point: memory is bounded by the limit plus the chunk that crossed it, not by
    // whatever the node felt like sending
    expect(state.pulled).toBeLessThanOrEqual(limit + CHUNK)
    expect(state.cancelled).toBe(true)
  })

  it('refuses an oversized declared length before reading a byte', async () => {
    const { response, state } = chunkedResponse(64 * 1024 * 1024, {
      'content-length': String(64 * 1024 * 1024)
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    await expect(buildNode().downloadBounded('api/file/cid', 1024)).rejects.toBeInstanceOf(
      ResponseTooLargeError
    )

    expect(state.pulled).toBe(0)
  })

  it('returns a body that fits', async () => {
    const { response } = chunkedResponse(3 * CHUNK)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    const result = await buildNode().downloadBounded('api/file/cid', 1024 * 1024)

    expect(result.byteLength).toBe(3 * CHUNK)
  })

  it('accepts a body exactly on the bound', async () => {
    const { response } = chunkedResponse(CHUNK)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    const result = await buildNode().downloadBounded('api/file/cid', CHUNK)

    expect(result.byteLength).toBe(CHUNK)
  })

  it('does not take the node offline for an oversized answer', async () => {
    const { response } = chunkedResponse(8 * 1024 * 1024)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    const node = buildNode()
    await expect(node.downloadBounded('api/file/cid', 1024)).rejects.toBeInstanceOf(
      ResponseTooLargeError
    )

    // It answered — it just answered with too much. Rotating away from it would be wrong, and
    // `requestWithRetry` must not retry this on another node either.
    expect(node.online).not.toBe(false)
  })

  it('reports an unreachable node as offline, so the client rotates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const node = buildNode()
    await expect(node.downloadBounded('api/file/cid', 1024)).rejects.toBeInstanceOf(
      NodeOfflineError
    )
    expect(node.online).toBe(false)
  })

  it('treats an error status as an unavailable node', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        headers: { get: () => null },
        body: null
      })
    )

    await expect(buildNode().downloadBounded('api/file/cid', 1024)).rejects.toBeInstanceOf(
      NodeOfflineError
    )
  })

  it('still bounds the response where streams are unavailable', async () => {
    // No `body` to read from — the check can only happen after the fact, but it must happen
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        body: null,
        arrayBuffer: async () => new ArrayBuffer(4096)
      })
    )

    await expect(buildNode().downloadBounded('api/file/cid', 1024)).rejects.toBeInstanceOf(
      ResponseTooLargeError
    )
  })

  it("aborts when the caller's signal fires", async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      controller.abort()

      return init.signal?.aborted
        ? Promise.reject(new DOMException('Aborted', 'AbortError'))
        : Promise.resolve(chunkedResponse(1024).response)
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      buildNode().downloadBounded('api/file/cid', 1024 * 1024, controller.signal)
    ).rejects.toBeInstanceOf(Error)

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('requests the file from the node it belongs to', async () => {
    const fetchMock = vi.fn().mockResolvedValue(chunkedResponse(128).response)
    vi.stubGlobal('fetch', fetchMock)

    await buildNode().downloadBounded('api/file/cid', 1024)

    expect(fetchMock.mock.calls[0][0]).toBe('https://ipfs.example/api/file/cid')
  })
})
