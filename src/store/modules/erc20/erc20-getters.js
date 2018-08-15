export default {
  gasPrice (state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  },

  transaction: state => id => state.transactions[id]
}
