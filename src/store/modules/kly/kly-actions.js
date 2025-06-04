import { CryptosInfo, FetchStatus } from '@/lib/constants'
import baseActions from '../kly-base/kly-base-actions'
import { kly } from '../../../lib/nodes/kly'
import shouldUpdate from '../../utils/coinUpdatesGuard'
import { validateStoredCryptoAddresses } from '@/lib/store-crypto-address.js'

let interval

const customActions = (getAccount) => ({
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
        const balance = await kly.getBalance(state.address)
        const nonce = await kly.getNonce(state.address)

        commit('status', { balance, nonce })
        commit('setBalanceStatus', FetchStatus.Success)
        commit('setBalanceActualUntil', Date.now() + CryptosInfo.KLY.balanceValidInterval)
      } catch (err) {
        commit('setBalanceStatus', FetchStatus.Error)
        console.warn(err)
      }
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
            }, Number(CryptosInfo.KLY.balanceCheckInterval))
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

  async updateStatus({ commit, dispatch }) {
    const account = getAccount()
    if (!account) return

    const address = account.getKlayr32Address()

    try {
      const balance = await kly.getBalance(address)
      const nonce = await kly.getNonce(address)

      commit('status', { balance, nonce })
      commit('setBalanceStatus', FetchStatus.Success)
    } catch (err) {
      commit('setBalanceStatus', FetchStatus.Error)

      console.warn(err)
    }

    // Last block height
    dispatch('updateHeight')
  },

  async updateHeight({ commit }) {
    try {
      const height = await kly.getHeight()

      commit('height', height)
    } catch (err) {
      console.warn(err)
    }
  },

  /**
   * Updates the transaction details
   * @param {{ dispatch: function, getters: object }} param0 Vuex context
   * @param {{hash: string}} payload action payload
   */
  updateTransaction({ dispatch, getters }, payload) {
    const tx = getters.transaction(payload.hash)

    if (tx && (tx.status === 'CONFIRMED' || tx.status === 'REJECTED')) {
      // If transaction is in one of the final statuses (either succeeded or failed),
      // just update the current height to recalculate its confirmations counter.
      return dispatch('updateHeight')
    } else {
      // Otherwise fetch the transaction details
      return dispatch('getTransaction', {
        ...payload,
        force: payload.force,
        updateOnly: payload.updateOnly
      })
    }
  }
})

export default {
  ...baseActions({
    customActions
  })
}
