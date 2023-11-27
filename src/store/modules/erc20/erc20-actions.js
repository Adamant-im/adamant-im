import * as ethUtils from '../../../lib/eth-utils'
import { FetchStatus, DEFAULT_ERC20_TRANSFER_GAS_LIMIT } from '@/lib/constants'
import EthContract from 'web3-eth-contract'
import Erc20 from './erc20.abi.json'
import createActions from '../eth-base/eth-base-actions'
import { AbiDecoder } from '@/lib/abi/abi-decoder'
import { checkTxInProcess } from '@/lib/txVerify'

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval is 25 sec: ERC20 balance */
const STATUS_INTERVAL = 25000

// Setup decoder
const abiDecoder = new AbiDecoder(Erc20)

const initTransaction = async (api, context, ethAddress, amount, increaseFee) => {
  const contract = new EthContract(Erc20, context.state.contractAddress)

  const nonce = await checkTxInProcess(api, context)
  const gasPrice = await api.getClient().getGasPrice()

  const transaction = {
    from: context.state.address,
    to: context.state.contractAddress,
    value: '0x0',
    gasPrice,
    nonce,
    data: contract.methods
      .transfer(ethAddress, ethUtils.toWhole(amount, context.state.decimals))
      .encodeABI()
  }

  const gasLimit = await api
    .getClient()
    .estimateGas(transaction)
    .catch(() => BigInt(DEFAULT_ERC20_TRANSFER_GAS_LIMIT))
  transaction.gasLimit = increaseFee ? ethUtils.increaseFee(gasLimit) : gasLimit

  return transaction
}

const parseTransaction = (context, tx) => {
  let recipientId = null
  let amount = null

  const decoded = abiDecoder.decodeMethod(tx.input)
  if (decoded && decoded.name === 'transfer') {
    decoded.params.forEach((x) => {
      if (x.name === '_to') recipientId = x.value
      if (x.name === '_value') amount = ethUtils.toFraction(x.value, context.state.decimals)
    })
  }

  if (recipientId) {
    return {
      // Why comparing to eth.actions, there is no fee and status?
      hash: tx.hash,
      senderId: tx.from,
      blockNumber: Number(tx.blockNumber),
      amount,
      recipientId,
      gasPrice: Number(tx.gasPrice || tx.effectiveGasPrice)
    }
  }

  return null
}

const createSpecificActions = (api) => ({
  updateBalance: {
    root: true,
    async handler({ state, commit }, payload = {}) {
      if (payload.requestedByUser) {
        commit('setBalanceStatus', FetchStatus.Loading)
      }

      try {
        const contract = new EthContract(Erc20, state.contractAddress)
        contract.setProvider(api.getClient().provider)

        const rawBalance = await contract.methods.balanceOf(state.address).call()
        const balance = Number(ethUtils.toFraction(rawBalance, state.decimals))

        commit('balance', balance)
        commit('setBalanceStatus', FetchStatus.Success)
      } catch (err) {
        commit('setBalanceStatus', FetchStatus.Error)
        console.log(err)
      }
    }
  },

  /** Updates ERC20 token balance */
  updateStatus(context) {
    if (!context.state.address) return

    const contract = new EthContract(Erc20, context.state.contractAddress)
    contract.setProvider(api.getClient().provider)

    contract.methods
      .balanceOf(context.state.address)
      .call()
      .then(
        (balance) => {
          context.commit(
            'balance',
            Number(ethUtils.toFraction(balance.toString(10), context.state.decimals))
          )
          context.commit('setBalanceStatus', FetchStatus.Success)
        },
        () => {
          context.commit('setBalanceStatus', FetchStatus.Error)
        }
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
