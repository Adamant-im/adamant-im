import axios from 'axios'

import config from '../config'
import * as utils from './eth-utils'

const cache = { }

/**
 * @typedef {Object} EthTx
 * @property {number} time
 * @property {string} txfrom
 * @property {string} txto
 * @property {number} gas
 * @property {number} gasprice
 * @property {number} block
 * @property {string} input
 * @property {string} txhash
 * @property {number} value
 * @property {string} prefix
 * @property {string} contract_to
 * @property {string} contract_value
 */

/**
 * @typedef {Object} Request
 * @property {string} address ETH address
 * @property {string} contract ERC20 contract (optional)
 * @property {number} from start from block number
 * @property {number} to up to block number
 * @property {number} limit defaults to 100
 * @property {number} offset defaults to 0
 */

/**
 * Retrieves ETH transactions list according to the specified criteria.
 * @param {Request} options request options
 * @returns {Promise<{total: number, items: Array<EthTx>}>}
 */
export function getTransactions (options) {
  const { address, contract, from, to, limit } = options

  const filters = []

  if (contract) {
    filters.push(
      `txto.eq.${contract}`,
      `or(txfrom.eq.${address},contract_to.eq.000000000000000000000000${address.replace('0x', '')})`
    )
  } else {
    filters.push(
      `contract_to.eq.`,
      `or(txfrom.eq.${address},txto.eq.${address})`
    )
  }

  if (from) {
    filters.push(`time.gte.${from}`)
  }

  if (to) {
    filters.push(`time.lte.${to}`)
  }

  const filterString = filters.join(',')

  if (!cache[filterString]) {
    const params = {
      and: `(${filters.join(',')})`,
      order: 'time.desc'
    }

    if (limit) params.limit = limit

    const config = {
      url: getUrl(),
      params
    }

    cache[filterString] = axios.request(config).then(
      ({ data, headers }) => {
        delete cache[filterString]

        const range = headers['content-range']
        const total = getTotalFromRange(range)

        return {
          total,
          items: data.map(parseTxFromIndex)
        }
      },
      error => {
        delete cache[filterString]
        return Promise.reject(error)
      }
    )
  }

  return cache[filterString]
}

/**
 * Parses the content range to extract the total count of records
 * @param {string} range range to parse
 */
function getTotalFromRange (range = '') {
  const index = range.indexOf('/')
  return (index >= 0) ? Number(range.substr(index + 1)) : NaN
}

function getUrl () {
  const servers = config.server.eth.filter(x => x.hasIndex).map(x => x.url)
  const index = Math.floor(Math.random() * servers.length)
  return servers[index] + '/ethtxs'
}

/**
 * Parses ETH index entry.
 * @param {EthTx} tx entry
 */
function parseTxFromIndex (tx) {
  const hash = tx.txhash.replace(/^.*x/, '0x').toLowerCase()

  const recipientId = tx.contract_to
    ? '0x' + tx.contract_to.substr(-40)
    : tx.txto.toLowerCase()

  const value = tx.contract_value
    ? parseInt(tx.contract_value, 16)
    : tx.value

  return {
    id: hash,
    hash,
    senderId: tx.txfrom.toLowerCase(),
    recipientId,
    amount: utils.toEther(value),
    fee: utils.calculateFee(tx.gas, tx.gasprice),
    status: 'SUCCESS',
    timestamp: tx.time * 1000,
    blockNumber: tx.block,
    time: tx.time
  }
}
