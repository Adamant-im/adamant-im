import baseGetters from '../lsk-base/lsk-base-getters'
import lskActions from './lsk-actions'
import validateAddress from '@/lib/validateAddress'

export default {
  ...baseGetters,

  fee: state => (amount, recipientAddress, data) => {
    recipientAddress = validateAddress(state.crypto, recipientAddress) ? recipientAddress : state.address
    return lskActions.calculateFee(null, {
      address: recipientAddress,
      amount,
      nonce: state.nonce,
      data: data || ''
    })
  },

  height (state) {
    return state.height
  }
}
