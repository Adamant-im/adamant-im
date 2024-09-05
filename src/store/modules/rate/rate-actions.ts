import { ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import rateInfoClient from '@/lib/nodes/rate-info-service'
import { RateState } from '@/store/modules/rate/types'

export let interval: NodeJS.Timeout

const UPDATE_RATES_INTERVAL = 90000

export const actions: ActionTree<RateState, RootState> = {
  async getAllRates({ commit }) {
    const { result, success } = await rateInfoClient.getAllRates()
    if (success) {
      commit('setRates', result)
    }
    commit('setLoaded')
  },
  async getHistoryRates({ state, commit }, { timestamp }) {
    if (!timestamp) return
    if (state.historyRates[timestamp] !== undefined) {
      return state.historyRates[timestamp]
    } else {
      const { result, success } = await rateInfoClient.getHistory(timestamp)
      if (success) {
        const rates = result[0]?.tickers ?? null
        commit('setHistoryRates', { name: timestamp, value: rates })
      }
    }
  },
  startInterval: {
    root: true,
    handler({ dispatch }) {
      function repeat() {
        dispatch('getAllRates')
          .catch((err) => console.error(err))
          .then(() => {
            interval = setTimeout(repeat, UPDATE_RATES_INTERVAL)
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
  }
}
