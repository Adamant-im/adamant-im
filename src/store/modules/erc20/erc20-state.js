import baseState from '../eth-base/eth-base-state'

export default function initialState (crypto, contractAddress, decimals) {
  return {
    crypto,
    contractAddress,
    decimals,
    ...baseState()
  }
}
