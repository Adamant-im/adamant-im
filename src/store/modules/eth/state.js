import baseState from '../eth-base/eth-base-state'
import { Cryptos, CryptosInfo } from '@/lib/constants'
import { toWei } from '@/lib/eth-utils'

export default () => {
  return {
    crypto: Cryptos.ETH,
    decimals: CryptosInfo['ETH'].decimals,
    gasPrice: toWei(CryptosInfo['ETH'].defaultGasPriceGwei, 'gwei'),
    blockNumber: 0,
    isPublished: false, // Indicates whether ETH address has been published to the KVS
    ...baseState()
  }
}
