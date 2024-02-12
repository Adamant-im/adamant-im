import { Web3Eth } from 'web3-eth'
import { TransactionNotFound as Web3TransactionNotFound } from 'web3-errors'
import { TransactionNotFound } from '@/lib/nodes/utils/errors'
import { EthNode } from './EthNode'
import { Client } from '../abstract.client'
import { normalizeTransaction } from './utils'
import { bytesToHex } from '@/lib/hex'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class EthClient extends Client<EthNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('eth')
    this.nodes = endpoints.map((endpoint) => new EthNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  async isTransactionFinalized(hash: string): Promise<boolean> {
    const node = this.getNode()

    try {
      const transaction = await node.client.getTransaction(hash)
      const isFinalized = !!transaction.blockNumber

      return isFinalized
    } catch (err) {
      return false
    }
  }

  async getTransaction(hash: string) {
    const node = this.getNode()

    try {
      const transaction = await node.client.getTransaction(hash)
      const isFinalized = transaction.blockNumber !== undefined

      const blockTimestamp = isFinalized
        ? await node.client.getBlock(transaction.blockNumber).then((block) => block.timestamp)
        : undefined

      return normalizeTransaction(transaction, blockTimestamp)
    } catch (err) {
      if (err instanceof Web3TransactionNotFound) {
        throw new TransactionNotFound(hash, this.type)
      }

      throw err
    }
  }

  sendSignedTransaction(...args: Parameters<Web3Eth['sendSignedTransaction']>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getNode()
        .client.sendSignedTransaction(...args)
        .on('transactionHash', (hash) => {
          if (typeof hash === 'string') {
            resolve(hash)
          } else {
            resolve(bytesToHex(hash))
          }
        })
        .on('error', reject)
    })
  }

  getNonce(address: string) {
    return this.getNode().client.getTransactionCount(address)
  }
}
