import { NodeInfo } from '@/types/wallets'
import { BlockchainSymbol } from './types'
import config from '../index'

export function getNodes(blockchain: BlockchainSymbol): NodeInfo[] {
  const nodes = config[blockchain]['nodes']['list']

  return nodes
}

export function getRandomNodeUrl(blockchain: BlockchainSymbol): string {
  const nodes = getNodes(blockchain)
  const index = Math.floor(Math.random() * nodes.length)

  const node = nodes[index]
  if (!node) {
    throw new Error(`Missing nodes in "${blockchain}" configuration`)
  }

  return node.url
}
