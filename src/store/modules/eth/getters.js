import baseGetters from '../eth-base/eth-base-getters'

const DEFAULT_GAS_PRICE = '20000000000' // 20 Gwei

export default {
  gasPrice (state) {
    return state.gasPrice || DEFAULT_GAS_PRICE
  },

  fee: state => amount => state.fee,

  privateKey: state => state.privateKey,

  web3Account: state => state.web3Account,

  ...baseGetters
}
