import axios from 'axios'
import getEnpointUrl from '@/lib/getEndpointUrl'

const state = () => ({
  rates: {},
  isLoaded: false,
  historyRates: {}
})

export let interval

const UPDATE_RATES_INTERVAL = 90000
const mutations = {
  setRates (state, rates) {
    state.rates = rates
  },
  setHistoryRates (state, historyRates) {
    state.historyRates[historyRates.name] = historyRates.value
  },
  loadRates (state) {
    state.isLoaded = true
  }
}
const actions = {
  getAllRates ({ commit }) {
    const url = getEnpointUrl('infoservice')
    return new Promise((resolve, reject) => {
      axios
        .get(`${url}/get`)
        .then((res) => {
          const rates = res.data.result
          commit('setRates', rates)
          commit('loadRates')
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  getHistoryRates ({ state, commit }, { timestamp }) {
    if (!timestamp) return
    const url = getEnpointUrl('infoservice')
    if (state.historyRates[timestamp] !== undefined) {
      return state.historyRates[timestamp]
    } else {
      return new Promise((resolve, reject) => {
        axios
          .get(`${url}/getHistory?timestamp=${timestamp}`)
          .then((res) => {
            const rates = res?.data?.result[0]?.tickers ?? null
            commit('setHistoryRates', { name: timestamp, value: rates })
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })
    }
  },
  startInterval: {
    root: true,
    handler ({ dispatch }) {
      function repeat () {
        dispatch('getAllRates')
          .catch(err => console.error(err))
          .then(() => {
            interval = setTimeout(repeat, UPDATE_RATES_INTERVAL)
          })
      }

      repeat()
    }
  },
  stopInterval: {
    root: true,
    handler () {
      clearTimeout(interval)
    }
  }
}
const getters = {
  historyRate: (state, getters, rootState) => (timestamp, amount, crypto) => {
    let historyRate
    const currentCurrency = rootState.options.currentRate
    const store = state.historyRates[timestamp]
    if (store) {
      historyRate = `${(store[`${crypto}/${currentCurrency}`] * amount).toFixed(2)} ${currentCurrency}`
    } else {
      historyRate = '�'
    }
    return historyRate
  },
  rate: (state, getters, rootState) => (amount, crypto) => {
    const currentCurrency = rootState.options.currentRate
    const store = state.rates[`${crypto}/${currentCurrency}`]
    const rate = store * amount
    return isNaN(rate) ? '�' : `${rate.toFixed(2)} ${currentCurrency}`
  }
}
export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true
}
