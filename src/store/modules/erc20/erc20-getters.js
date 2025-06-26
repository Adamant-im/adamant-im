import baseGetters from '../eth-base/eth-base-getters'

export default {
  gasPrice(state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  },

  fee: (state) => state.fee,

  ...baseGetters
}
