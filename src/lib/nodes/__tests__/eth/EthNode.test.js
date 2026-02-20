import { afterEach, describe, expect, it, vi } from 'vitest'
import { EthNode } from '../../eth/EthNode.ts'
import { nodesStorage } from '../../storage.ts'

const ALT_IP = 'http://95.216.114.252:44099'
const DOMAIN_URL = 'https://ethnode2.adamant.im'

const createNode = (endpoint = { alt_ip: ALT_IP, url: DOMAIN_URL }) => {
  vi.spyOn(nodesStorage, 'isActive').mockReturnValue(false)

  const node = new EthNode(endpoint)
  node.active = true

  return node
}

const stopHealthcheckTimer = (node) => {
  if (node.timer) {
    clearTimeout(node.timer)
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('EthNode healthcheck routing', () => {
  it('keeps DOMAIN mode after first successful domain healthcheck', async () => {
    const node = createNode()
    node.checkHealth = vi.fn().mockResolvedValue({ height: 1, ping: 10 })

    await node.startHealthcheck()
    stopHealthcheckTimer(node)

    expect(node.checkHealth).toHaveBeenCalledTimes(1)
    expect(node.preferDomain).toBe(true)
    expect(node.online).toBe(true)
    expect(node.healthcheckCount).toBe(1)

    node.checkHealth = vi.fn().mockRejectedValue(new Error('Domain is temporarily offline'))

    await node.startHealthcheck()
    stopHealthcheckTimer(node)

    expect(node.checkHealth).toHaveBeenCalledTimes(1)
    expect(node.preferDomain).toBe(true)
    expect(node.online).toBe(false)
  })

  it('falls back to IP in the same cycle and locks IP mode when IP succeeds first', async () => {
    const node = createNode({
      alt_ip: ALT_IP,
      url: 'https://unreachable.adamant.im'
    })
    const attempts = []

    node.checkHealth = vi.fn(async function checkHealthMock() {
      attempts.push(this.getBaseURL(this))

      if (this.preferDomain) {
        throw new Error('Domain is unavailable')
      }

      return { height: 2, ping: 20 }
    })

    await node.startHealthcheck()
    stopHealthcheckTimer(node)

    expect(attempts).toEqual(['https://unreachable.adamant.im', ALT_IP])
    expect(node.preferDomain).toBe(false)
    expect(node.online).toBe(true)
    expect(node.healthcheckCount).toBe(1)
    expect(node.protocol).toBe('http:')
  })

  it('retries DOMAIN -> IP on each cycle until a connection type is determined', async () => {
    const node = createNode({
      alt_ip: ALT_IP,
      url: 'https://unreachable.adamant.im'
    })
    const attempts = []

    node.checkHealth = vi.fn(async function checkHealthMock() {
      attempts.push(this.getBaseURL(this))
      throw new Error('Node is unavailable')
    })

    await node.startHealthcheck()
    stopHealthcheckTimer(node)

    expect(attempts).toEqual(['https://unreachable.adamant.im', ALT_IP])
    expect(node.healthcheckCount).toBe(0)
    expect(node.preferDomain).toBe(true)
    expect(node.online).toBe(false)

    await node.startHealthcheck()
    stopHealthcheckTimer(node)

    expect(attempts).toEqual([
      'https://unreachable.adamant.im',
      ALT_IP,
      'https://unreachable.adamant.im',
      ALT_IP
    ])
  })

  it('marks node offline when both domain and HTTP fallback fail in HTTPS context', async () => {
    const node = createNode({
      alt_ip: ALT_IP,
      url: 'https://unreachable.adamant.im'
    })

    node.isHttpAllowed = vi.fn().mockReturnValue(false)
    node.checkHealth = vi.fn().mockRejectedValue(new Error('Node is unavailable'))

    await node.startHealthcheck()
    stopHealthcheckTimer(node)

    expect(node.online).toBe(false)
    expect(node.healthcheckAttemptCount).toBe(1)
    expect(node.healthcheckCount).toBe(0)
  })

  it('resets node state to initial updating and starts healthcheck when re-enabled', () => {
    const node = createNode()
    node.outOfSync = true
    node.online = true
    node.height = 123

    const startHealthcheckSpy = vi.spyOn(node, 'startHealthcheck').mockResolvedValue(node)
    const fetchNodeVersionSpy = vi.spyOn(node, 'fetchNodeVersion').mockResolvedValue()

    node.toggleNode(false)
    const status = node.toggleNode(true)
    stopHealthcheckTimer(node)

    expect(startHealthcheckSpy).toHaveBeenCalledTimes(1)
    expect(fetchNodeVersionSpy).toHaveBeenCalledTimes(1)
    expect(status.active).toBe(true)
    expect(status.status).toBe('offline')
    expect(status.isUpdating).toBe(true)
    expect(status.outOfSync).toBe(false)
    expect(status.ping).toBe(Infinity)
    expect(status.height).toBe(0)
  })

  it('treats hanging health-check requests as offline and unlocks next cycles', async () => {
    vi.useFakeTimers()

    const node = createNode()
    node.checkHealth = vi.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Simulate a request hanging forever
        })
    )

    const healthcheckPromise = node.startHealthcheck()
    await vi.advanceTimersByTimeAsync(20_000)
    await healthcheckPromise
    stopHealthcheckTimer(node)

    expect(node.online).toBe(false)
    expect(node.healthcheckInProgress).toBe(false)
    expect(node.healthcheckAttemptCount).toBe(1)
  })
})
