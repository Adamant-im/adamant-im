import axios from 'axios'
import getEnpointUrl from '@/lib//getEndpointUrl'

const state = () => ({
  rates: {}
})

// const getters = {
//   getRates: (state) => state.rates
// }

const mutations = {
  set_rates (state, rates) {
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
          commit('set_rates', rates)
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
