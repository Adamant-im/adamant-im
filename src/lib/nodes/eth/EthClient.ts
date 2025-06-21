import { Web3Eth } from 'web3-eth'
import { TransactionNotFound as Web3TransactionNotFound } from 'web3-errors'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { TransactionNotFound } from '@/lib/nodes/utils/errors'
import { CryptoSymbol } from '@/lib/constants'
import { bytesToHex } from '@/lib/hex'
import type { NodeInfo } from '@/types/wallets'
import { EthNode } from './EthNode'
import { Client } from '../abstract.client'
import { Node } from '../abstract.node'
import { normalizeEthTransaction, normalizeErc20Transaction } from './utils'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class EthClient extends Client<EthNode> {
  constructor(endpoints: NodeInfo[] = [], minNodeVersion = '0.0.0') {
    super('eth', 'node', NODE_LABELS.EthNode)
    this.nodes = endpoints.map((endpoint) => new EthNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  async isTransactionFinalized(hash: string): Promise<boolean> {
    const client = this.getNodeClient()

    try {
      const transaction = await client.getTransaction(hash)
      const isFinalized = !!transaction.blockNumber

      return isFinalized
    } catch {
      return false
    }
  }

  // Use with caution:
  // This method can throw an error if there are no online nodes.
  // Better use "useClient()" method.
  getClient(): Node['client'] {
    // Ethereum nodes return a new client every time depending on `preferDomain` property.
    return this.getNode().client()
  }

  /**
   * Fetch a single transaction by ID
   * @param hash Transaction hash
   * @param address Owner's ETH address
   */
  async getEthTransaction(hash: string, address: string) {
    const client = this.getNodeClient()

    try {
      const transaction = await client.getTransaction(hash)
      const isFinalized = transaction.blockNumber !== undefined

      const blockTimestamp = isFinalized
        ? await client.getBlock(transaction.blockNumber).then((block) => block.timestamp)
        : undefined
      const receipt = isFinalized ? await client.getTransactionReceipt(hash) : undefined

      return normalizeEthTransaction({ transaction, receipt }, address, blockTimestamp)
    } catch (err) {
      if (err instanceof Web3TransactionNotFound) {
        throw new TransactionNotFound(hash, this.type)
      }

      throw err
    }
  }

  /**
   * Fetch a single ERC20 transaction by ID
   * @param hash Transaction hash
   * @param address Owner's ETH address
   * @param crypto Crypto symbol
   */
  async getErc20Transaction(hash: string, address: string, crypto: CryptoSymbol) {
    const client = this.getNodeClient()

    try {
      const transaction = await client.getTransaction(hash)
      const isFinalized = transaction.blockNumber !== undefined

      const blockTimestamp = isFinalized
        ? await client.getBlock(transaction.blockNumber).then((block) => block.timestamp)
        : undefined
      const receipt = isFinalized ? await client.getTransactionReceipt(hash) : undefined

      return normalizeErc20Transaction(crypto, { transaction, receipt }, address, blockTimestamp)
    } catch (err) {
      if (err instanceof Web3TransactionNotFound) {
        throw new TransactionNotFound(hash, this.type)
      }

      throw err
    }
  }

  sendSignedTransaction(...args: Parameters<Web3Eth['sendSignedTransaction']>): Promise<string> {
    const client = this.getNodeClient()

    return new Promise((resolve, reject) => {
      try {
        client
          .sendSignedTransaction(...args)
          .on('transactionHash', (hash) => {
            if (typeof hash === 'string') {
              resolve(hash)
            } else {
              resolve(bytesToHex(hash))
            }
          })
          .on('error', reject)
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Get node client instance depending on availability of a domain.
   * @returns { Web3Eth } Web3 Ethereum module instance.
   */
  getNodeClient(): Web3Eth {
    return this.getNode().client()
  }

  async getNonce(address: string) {
    const client = this.getNodeClient()

    return client.getTransactionCount(address)
  }

  async getHeight() {
    const client = this.getNodeClient()
    const blockNumber = await client.getBlockNumber()

    return Number(blockNumber)
  }
}
