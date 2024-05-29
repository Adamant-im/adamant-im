import { ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import rateInfoClient from '@/lib/nodes/rate-info-service'
import { RateState } from '@/store/modules/rate/types.ts'

export let interval: NodeJS.Timeout

const UPDATE_RATES_INTERVAL = 90000

export const actions: ActionTree<RateState, RootState> = {
  getAllRates({ commit }) {
    return new Promise((resolve, reject) => {
      rateInfoClient
        .getAllRates()
        .then(({ result, success }) => {
          if (success) {
            commit('setRates', result)
          }
          commit('loadRates')
          resolve(result)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  getHistoryRates({ state, commit }, { timestamp }) {
    if (!timestamp) return
    if (state.historyRates[timestamp] !== undefined) {
      return state.historyRates[timestamp]
    } else {
      return new Promise((resolve, reject) => {
        rateInfoClient
          .getHistory(timestamp)
          .then(({ result, success }) => {
            if (success) {
              const rates = result[0]?.tickers ?? null
              commit('setHistoryRates', { name: timestamp, value: rates })
            }
            resolve(result)
          })
          .catch((err) => {
            reject(err)
          })
      })
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
