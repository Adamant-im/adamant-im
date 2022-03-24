import axios from 'axios'
import getEnpointUrl from '@/lib//getEndpointUrl'

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
    state.historyRates = historyRates
  },
  clearHistoryRates (state) {
    state.historyRates = {}
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
  getHistoryRates ({ commit }, { date, coin }) {
    const url = getEnpointUrl('infoservice')
    return new Promise((resolve, reject) => {
      axios
        .get(`${url}/getHistory?timestamp=${date}&coin=${coin}`)
        .then((res) => {
          const rates = res.data.result[0].tickers
          commit('setHistoryRates', rates)
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
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
export default {
  state,
  mutations,
  actions,
  namespaced: true
}
