import * as admApi from '../../../lib/adamant-api'
import * as utils from '../../../lib/eth-utils'
import createActions from '../eth-base/eth-base-actions'

import { Fees, ETH_TRANSFER_GAS } from '../../../lib/constants'

const KVS_ADDRESS = 'eth:address'

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval */
const STATUS_INTERVAL = 8000

// const CHUNK_SIZE = 25

let isAddressBeingStored = null
/**
 * Stores ETH address to the Adamant KVS if it's not there yet
 * @param {*} context
 */
function storeEthAddress (context) {
  if (isAddressBeingStored) return
  if (!admApi.isReady()) return
  if (!context.state.address) return
  if (context.rootState.balance < Fees.KVS) return
  if (context.state.isPublished) return

  isAddressBeingStored = true
  admApi.getStored(KVS_ADDRESS)
    .then(address => (address)
      ? true
      : admApi.storeValue(KVS_ADDRESS, context.state.address).then(response => response.success)
    )
    .then(
      success => {
        isAddressBeingStored = false
        if (success) context.commit('isPublished')
      },
      () => { isAddressBeingStored = false }
    )
}

const initTransaction = (api, context, ethAddress, amount) => {
  return {
    from: context.state.address,
    to: ethAddress,
    value: api.fromDecimal(utils.toWei(amount)),
    gas: api.fromDecimal(ETH_TRANSFER_GAS),
    gasPrice: api.fromDecimal(context.getters.gasPrice)
  }
}

const parseTransaction = (context, tx, timestamp) => {
  return {
    hash: tx.hash,
    senderId: tx.from,
    recipientId: tx.to,
    amount: utils.toEther(tx.value.toString(10)),
    fee: utils.calculateFee(tx.gas, tx.gasPrice.toString(10)),
    status: tx.blockNumber ? 'SUCCESS' : 'PENDING',
    timestamp: timestamp, // TODO: fetch from block?
    blockNumber: tx.blockNumber
  }
}

const createSpecificActions = (api, queue) => ({
  /** On account update this handler ensures that ETH address is in the KVS */
  updateAccount: {
    root: true,
    handler (context) {
      storeEthAddress(context)
    }
  },

  /**
   * Requests ETH account status: balance, gas price, etc.
   * @param {*} context Vuex action context
   */
  updateStatus (context) {
    if (!context.state.address) return

    const supplier = () => {
      if (!context.state.address) return []

      const block = context.state.blockNumber ? Math.max(0, context.state.blockNumber - 12) : 0

      return [
        // Balance
        api.eth.getBalance.request(context.state.address, block || 'latest', (err, balance) => {
          if (!err) context.commit('balance', utils.toEther(balance.toString(10)))
        }),
        // Current gas price
        api.eth.getGasPrice.request((err, price) => {
          if (!err) {
            const gasPrice = 3 * price.toNumber()
            context.commit('gasPrice', {
              gasPrice,
              fee: utils.calculateFee(ETH_TRANSFER_GAS, gasPrice)
            })
          }
        }),
        // Current block number
        api.eth.getBlockNumber.request((err, number) => {
          if (!err) context.commit('blockNumber', number)
        })
      ]
    }

    const delay = Math.max(0, STATUS_INTERVAL - Date.now() + lastStatusUpdate)
    setTimeout(() => {
      if (context.state.address) {
        queue.enqueue('status', supplier)
        lastStatusUpdate = Date.now()
        context.dispatch('updateStatus')
      }
    }, delay)
  }
})

export default createActions({
  onInit: storeEthAddress,
  initTransaction,
  parseTransaction,
  createSpecificActions
})
