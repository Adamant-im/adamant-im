import abiDecoder from 'abi-decoder'

import * as ethUtils from '../../../lib/eth-utils'
import { INCREASE_FEE_MULTIPLIER } from '../../../lib/constants'
import Erc20 from './erc20.abi.json'
import createActions from '../eth-base/eth-base-actions'

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval is 25 sec: ERC20 balance */
const STATUS_INTERVAL = 25000

// Setup decoder
abiDecoder.addABI(Erc20)

const initTransaction = (api, context, ethAddress, amount, increaseFee) => {
  const contract = new api.Contract(Erc20, context.state.contractAddress)

  const transaction = {
    from: context.state.address,
    to: context.state.contractAddress,
    value: '0x0',
    // gasLimit: api.fromDecimal(ERC20_TRANSFER_GAS), // Don't take default value, instead calculate with estimateGas(transactionObject)
    // gasPrice: context.getters.gasPrice, // Set gas price to auto calc. Deprecated after London hardfork
    // nonce // Let sendTransaction choose it
    data: contract.methods.transfer(ethAddress, ethUtils.toWhole(amount, context.state.decimals)).encodeABI()
  }

  return api.estimateGas(transaction).then(gasLimit => {
    gasLimit = increaseFee ? gasLimit * INCREASE_FEE_MULTIPLIER : gasLimit
    transaction.gas = gasLimit
    return transaction
  })
}

const parseTransaction = (context, tx) => {
  let recipientId = null
  let amount = null

  const decoded = abiDecoder.decodeMethod(tx.input)
  if (decoded && decoded.name === 'transfer') {
    decoded.params.forEach(x => {
      if (x.name === '_to') recipientId = x.value
      if (x.name === '_value') amount = ethUtils.toFraction(x.value, context.state.decimals)
    })
  }

  if (recipientId) {
    return {
      // Why comparing to eth.actions, there is no fee and status?
      hash: tx.hash,
      senderId: tx.from,
      blockNumber: tx.blockNumber,
      amount,
      recipientId,
      gasPrice: +(tx.gasPrice || tx.effectiveGasPrice)
    }
  }

  return null
}

const createSpecificActions = (api, queue) => ({
  /** Updates ERC20 token balance */
  updateStatus (context) {
    if (!context.state.address) return

    const contract = new api.Contract(Erc20, context.state.contractAddress)
    contract.methods.balanceOf(context.state.address).call()
      .then(
        balance => {
          context.commit('balance', Number(ethUtils.toFraction(balance.toString(10), context.state.decimals)))
        },
        () => { } // Not this time
      )
      .then(() => {
        const delay = Math.max(0, STATUS_INTERVAL - Date.now() + lastStatusUpdate)
        setTimeout(() => {
          if (context.state.address) {
            lastStatusUpdate = Date.now()
            context.dispatch('updateStatus')
          }
        }, delay)
      })
  }
})

export default createActions({
  initTransaction,
  parseTransaction,
  createSpecificActions
})
