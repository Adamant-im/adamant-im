import baseGetters from '../lsk-base/lsk-base-getters'
import lskActions from './lsk-actions'

export default {
  ...baseGetters,

  fee: state => (amount, recipientAddress, data) => {
    return lskActions.calculateFee(null, { address: recipientAddress || state.address, amount, nonce: state.nonce, data: data || '' })
  },

  height (state) {
    return state.height
  }
}
