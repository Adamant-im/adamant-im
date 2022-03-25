import axios from 'axios'
import getEnpointUrl from '@/lib/getEndpointUrl'
import { EPOCH } from '@/lib/constants'
// eslint-disable-next-line no-unused-vars
import Vue from 'vue'

const state = () => ({
  rates: {},
  isLoaded: false,
  historyRates: {},
  historyRatesCached: {}
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
  setHistoryRatesCached (state, historyRates) {
    Vue.set(state.historyRatesCached, historyRates.name, historyRates.value)
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
  getHistoryRates ({ commit }, { date, coin, currentRate }) {
    const url = getEnpointUrl('infoservice')
    const key = `${coin}/${currentRate}/${date}`
    date = coin === 'ADM' ? (Math.floor((date * 1000 + EPOCH) / 1000)) : Math.floor(date / 1000)
    return new Promise((resolve, reject) => {
      axios
        .get(`${url}/getHistory?timestamp=${date}&coin=${coin}`)
        .then((res) => {
          const rates = res.data.result[0].tickers
          const value = rates[`${coin}/${currentRate}`]
          commit('setHistoryRates', rates)
          commit('setHistoryRatesCached', { name: key, value: value })
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
