export default {
  gasPrice (state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  }
}
