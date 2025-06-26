import baseState from '../eth-base/eth-base-state'

export default function initialState(crypto, contractAddress, decimals) {
  return {
    crypto,
    contractAddress,
    decimals,
    gasPrice: 0,
    gasLimit: 0,
    fee: 0,
    ...baseState()
  }
}
