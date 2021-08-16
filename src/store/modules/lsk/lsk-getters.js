import baseGetters from '../lsk-base/lsk-base-getters'
import lskActions from './lsk-actions'

export default {
  ...baseGetters,

  fee: state => amount => {
    return lskActions.calculateFee(null, { address: state.address, amount, nonce: state.nonce, data: '' })
  },

  height (state) {
    return state.height
  }
}
