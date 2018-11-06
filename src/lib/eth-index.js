import axios from 'axios'

import config from '../config.json'
import * as utils from '../../../lib/eth-utils'

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
 * Retrieves ETH transactions list according to the specified criteriae.
 * @param {Request} options request options
 * @returns {Promise<{total: number, items: Array<EthTx>}>}
 */
export function getTransactions (options) {
  const { address, contract, from, to, limit } = options

  const filters = []

  if (contract) {
    filters.push(
      `txto.eq.${contract}`,
      `or(txfrom.eq.${address},contract_to.like.*${address.replace('0x', '')})`
    )
  } else {
    filters.push(
      `input.eq.0x`,
      `or(txfrom.eq.${address},txto.eq.${address})`
    )
  }

  if (from) {
    filters.push(`time.gte.${from}`)
  }

  if (to) {
    filters.push(`time.lte.${to}`)
  }

  const params = {
    and: `(${filters.join(',')})`,
    order: 'time.desc'
  }

  if (limit) params.limit = limit

  const config = {
    url: getUrl(),
    params
  }

  return axios.request(config).then(({ data, headers }) => {
    const range = headers['content-range']
    const total = getTotalFromRange(range)

    return {
      total,
      items: data.map(parseTxFromIndex)
    }
  })
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
  const url = Math.floor(Math.random() * servers.length)
  return url + '/ethtxs'
}

/**
 * Parses ETH index entry.
 * @param {EthTx} tx entry
 */
function parseTxFromIndex (tx) {
  return {
    hash: tx.txhash.replace('\\\\x', '0x'),
    senderId: tx.txfrom,
    recipientId: tx.txto,
    amount: utils.toEther(tx.value),
    fee: utils.calculateFee(tx.gas, tx.gasPrice),
    status: 'SUCCESS',
    timestamp: tx.time,
    blockNumber: tx.block
  }
}
