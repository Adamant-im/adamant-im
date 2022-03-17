import axios from 'axios'
import getEnpointUrl from '@/lib//getEndpointUrl'

const state = () => ({
  rates: {}
})

// const getters = {
//   getRates: (state) => state.rates
// }

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
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
export default {
  state,
  // getters,
  mutations,
  actions,
  namespaced: true
}
