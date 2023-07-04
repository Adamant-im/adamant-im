import * as utils from '../../../lib/eth-utils'
import createActions from '../eth-base/eth-base-actions'

import { DEFAULT_ETH_TRANSFER_GAS, INCREASE_FEE_MULTIPLIER } from '../../../lib/constants'
import { storeCryptoAddress } from '../../../lib/store-crypto-address'

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval is 25 sec: ETH balance, gas price, last block height */
const STATUS_INTERVAL = 25000

/**
 * Stores ETH address to the ADAMANT KVS if it's not there yet
 * @param {*} context
 */
function storeEthAddress(context) {
  storeCryptoAddress(context.state.crypto, context.state.address)
}

const initTransaction = (api, context, ethAddress, amount, increaseFee) => {
  const transaction = {
    from: context.state.address,
    to: ethAddress,
    value: utils.toWei(amount)
    // gas: api.fromDecimal(DEFAULT_ETH_TRANSFER_GAS), // Don't take default value, instead calculate with estimateGas(transactionObject)
    // gasPrice: context.getters.gasPrice // Set gas price to auto calc. Deprecated after London hardfork
    // nonce // Let sendTransaction choose it
  }

  return api.estimateGas(transaction).then((gasLimit) => {
    gasLimit = increaseFee ? gasLimit * INCREASE_FEE_MULTIPLIER : gasLimit
    transaction.gas = gasLimit
    return transaction
  })
}

const parseTransaction = (context, tx) => {
  return {
    hash: tx.hash,
    senderId: tx.from,
    recipientId: tx.to,
    amount: utils.toEther(tx.value.toString(10)),
    fee: utils.calculateFee(tx.gas, (tx.gasPrice || tx.effectiveGasPrice).toString(10)),
    status: tx.blockNumber ? 'CONFIRMED' : 'PENDING',
    blockNumber: tx.blockNumber,
    gasPrice: +(tx.gasPrice || tx.effectiveGasPrice)
  }
}

const createSpecificActions = (api, queue) => ({
  /**
   * Requests ETH account status: balance, gas price, last block height
   * @param {*} context Vuex action context
   */
  updateStatus(context) {
    if (!context.state.address) return

    const supplier = () => {
      if (!context.state.address) return []

      return [
        // Balance
        api.getBalance.request(context.state.address, 'latest', (err, balance) => {
          if (!err) context.commit('balance', Number(utils.toEther(balance.toString())))
        }),
        // Current gas price
        api.getGasPrice.request((err, price) => {
          // It is OK with London hardfork
          if (!err) {
            context.commit('gasPrice', {
              gasPrice: price, // string type
              fee: +(+utils.calculateFee(DEFAULT_ETH_TRANSFER_GAS, price)).toFixed(8) // number type, in ETH
            })
          }
        }),
        // Current block number
        api.getBlockNumber.request((err, number) => {
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
