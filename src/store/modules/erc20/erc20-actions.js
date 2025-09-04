import * as ethUtils from '../../../lib/eth-utils'
import { FetchStatus, CryptosInfo } from '@/lib/constants'
import EthContract from 'web3-eth-contract'
import Erc20 from './erc20.abi.json'
import createActions from '../eth-base/eth-base-actions'
import shouldUpdate from '../../utils/coinUpdatesGuard'
import { validateStoredCryptoAddresses } from '@/lib/store-crypto-address.js'

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval is 25 sec: ERC20 balance */
const STATUS_INTERVAL = 25000
/** Interval for updating balances */
let interval

const initTransaction = async (api, context, ethAddress, amount, nonce, increaseFee) => {
  const contract = new EthContract(Erc20, context.state.contractAddress)

  const gasPrice = BigInt(context.getters.finalGasPrice(increaseFee))
  const amountWei = ethUtils.toWhole(amount, context.state.decimals)

  const transaction = {
    from: context.state.address,
    to: context.state.contractAddress,
    value: '0x0',
    gasPrice,
    nonce,
    data: contract.methods.transfer(ethAddress, amountWei).encodeABI()
  }

  const tokenInfo = CryptosInfo[context.state.crypto]
  const ethInfo = CryptosInfo['ETH']

  const reliabilityGasLimitPercent =
    tokenInfo.reliabilityGasLimitPercent ?? ethInfo.reliabilityGasLimitPercent

  try {
    let estimatedGasLimit = await api.useClient((client) => client.estimateGas(transaction))

    const reliableGasLimit = ethUtils.calculateReliableValue(
      estimatedGasLimit,
      reliabilityGasLimitPercent
    )
    transaction.gasLimit = BigInt(reliableGasLimit.integerValue().toString())
  } catch {
    transaction.gasLimit = BigInt(tokenInfo.defaultGasLimit ?? ethInfo.defaultGasLimit)
  }

  return transaction
}

const createSpecificActions = (api) => ({
  updateBalance: {
    async handler({ commit, rootGetters, state }, payload = {}) {
      const coin = state.crypto

      if (!shouldUpdate(() => rootGetters['wallets/getVisibility'](coin))) {
        return
      }

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
        commit('setBalanceActualUntil', Date.now() + CryptosInfo.ETH.balanceValidInterval)
      } catch (err) {
        commit('setBalanceStatus', FetchStatus.Error)
        console.warn(err)
      }
    }
  },

  /** Wrapper to manually request balance update if needed */
  requestBalanceUpdate: {
    root: true,
    handler({ dispatch }) {
      dispatch('updateBalance')
    }
  },

  initBalanceUpdate: {
    root: true,
    handler({ dispatch }) {
      function repeat() {
        validateStoredCryptoAddresses()
        dispatch('updateBalance')
          .catch((err) => console.error(err))
          .then(() => {
            interval = setTimeout(() => {
              repeat()
            }, CryptosInfo.ETH.balanceCheckInterval)
          })
      }
      repeat()
    }
  },

  stopInterval: {
    root: true,
    handler() {
      clearTimeout(interval)
    }
  },

  /** Updates ERC20 token balance */
  updateStatus(context) {
    if (!context.state.address) return

    const coin = context.state.crypto

    if (!shouldUpdate(() => context.rootGetters['wallets/getVisibility'](coin))) {
      return
    }

    try {
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
    } catch (err) {
      console.warn(err)
    }
  }
})

export default createActions({
  initTransaction,
  createSpecificActions
})
