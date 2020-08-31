import abiDecoder from 'abi-decoder'

import * as ethUtils from '../../../lib/eth-utils'
import { INCREASE_FEE_MULTIPLIER } from '../../../lib/constants'
import Erc20 from './erc20.abi.json'
import createActions from '../eth-base/eth-base-actions'

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval */
const STATUS_INTERVAL = 8000

// Setup decoder
abiDecoder.addABI(Erc20)

const initTransaction = (api, context, ethAddress, amount, increaseFee) => {
  const contract = api.eth.contract(Erc20).at(context.state.contractAddress)

  const transaction = {
    from: context.state.address,
    to: context.state.contractAddress,
    value: api.fromDecimal('0'),
    // gasLimit: api.fromDecimal(ERC20_TRANSFER_GAS), // Don't take default value, instead calculate with estimateGas(transactionObject)
    gasPrice: api.fromDecimal(context.getters.gasPrice),
    data: contract.transfer.getData(ethAddress, ethUtils.toWhole(amount, context.state.decimals))
  }

  let gasLimit = api.eth.estimateGas(transaction)
  gasLimit = increaseFee ? (gasLimit * INCREASE_FEE_MULTIPLIER).toString(16) : gasLimit.toString(16)
  transaction.gas = '0x' + gasLimit

  return transaction
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
      hash: tx.hash,
      senderId: tx.from,
      blockNumber: tx.blockNumber,
      amount,
      recipientId,
      gasPrice: tx.gasPrice.toNumber(10)
    }
  }

  return null
}

const createSpecificActions = (api, queue) => ({
  /** Updates crypto balance info */
  updateStatus (context) {
    if (!context.state.address) return

    const contract = api.eth.contract(Erc20).at(context.state.contractAddress)

    ethUtils.promisify(contract.balanceOf.call, context.state.address)
      .then(
        balance => context.commit('balance', Number(
          ethUtils.toFraction(balance.toString(10), context.state.decimals)
        )),
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
