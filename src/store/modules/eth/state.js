import baseState from '../eth-base/eth-base-state'
import { Cryptos } from '../../../lib/constants'

export default () => {
  return {
    crypto: Cryptos.ETH,
    gasPrice: 0,
    blockNumber: 0,
    fee: 0,
    isPublished: false, // Indicates whether ETH address has been published to the KVS
    ...baseState()
  }
}
