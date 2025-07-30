import { describe, expect, it } from 'vitest'

import { EthNode } from '../../eth/EthNode.ts'

const nodeByDomain = new EthNode({
    alt_ip: 'http://95.216.114.252:44099',
    url: 'https://ethnode2.adamant.im'
  }),
  nodeByIP = new EthNode({
    alt_ip: 'http://95.216.114.252:44099',
    url: 'https://aaa.adamant.im'
  }),
  nodeOffline = new EthNode({
    alt_ip: 'http://111.111.111.111:44099',
    url: 'https://aaa.adamant.im'
  })

describe('client', () => {
  describe('by domain', () => {
    it('get block number', async () => {
      expect(await nodeByDomain.client().getBlockNumber()).toBeTypeOf('bigint')
    })
  })
  describe('by IP', () => {
    it('get block number', async () => {
      try {
        await nodeByIP.client().getBlockNumber()
      } catch (error) {
        expect(error).toEqual({
          message:
            'request to https://aaa.adamant.im/ failed, reason: getaddrinfo ENOTFOUND aaa.adamant.im',
          type: 'system',
          errno: 'ENOTFOUND',
          code: 'ENOTFOUND'
        })
      }
    })
  })
  describe('offline', () => {
    it('get block number', async () => {
      try {
        await nodeOffline.client().getBlockNumber()
      } catch (error) {
        expect(error).toEqual({
          message:
            'request to https://aaa.adamant.im/ failed, reason: getaddrinfo ENOTFOUND aaa.adamant.im',
          type: 'system',
          errno: 'ENOTFOUND',
          code: 'ENOTFOUND'
        })
      }
    })
  })
})
describe('node', () => {
  describe('by domain', () => {
    it('start healthcheck', async () => {
      const node = await nodeByDomain.startHealthcheck()

      expect(node.altIp).toBe('http://95.216.114.252:44099')
      expect(node.altIpAvailable).toBe(false)
      expect(node.availableByDomain).toBe(true)
      expect(node.hostname).toBe('ethnode2.adamant.im')
      expect(node.online).toBe(true)
      expect(node.preferDomain).toBe(true)
      expect(node.url).toBe('https://ethnode2.adamant.im')
    })
  })
  describe('by IP', () => {
    it('start healthcheck', async () => {
      const node = await nodeByIP.startHealthcheck()

      expect(node.altIp).toBe('http://95.216.114.252:44099')
      expect(node.altIpAvailable).toBe(false)
      expect(node.availableByDomain).toBe(false)
      expect(node.hostname).toBe('aaa.adamant.im')
      expect(node.online).toBe(true)
      expect(node.preferDomain).toBe(false)
      expect(node.url).toBe('https://aaa.adamant.im')
    })
  })
  describe('offline', () => {
    it('start healthcheck', async () => {
      const node = await nodeOffline.startHealthcheck()

      expect(node.altIp).toBe('http://111.111.111.111:44099')
      expect(node.altIpAvailable).toBe(false)
      expect(node.availableByDomain).toBe(false)
      expect(node.hostname).toBe('aaa.adamant.im')
      expect(node.online).toBe(true)
      expect(node.preferDomain).toBe(false)
      expect(node.url).toBe('https://aaa.adamant.im')
    })
  })
})
