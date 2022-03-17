import axios from 'axios'
import getEnpointUrl from '@/lib//getEndpointUrl'

const state = () => ({
  rates: {}
})

// const getters = {
//   getRates: (state) => state.rates
// }
export let interval

const UPDATE_RATES_INTERVAL = 90000
const mutations = {
  setRates (state, rates) {
    state.rates = rates
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
          resolve(res)
          console.log('All rates: updated')
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
  },
  reset: {
    root: true,
    handler ({ commit }) {
      commit('reset')
    }
  }
}
export default {
  state,
  // getters,
  mutations,
  actions,
  namespaced: true
}
