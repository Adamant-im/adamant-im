import { isErc20, Cryptos } from '../../../lib/constants'

export default {
  /**
   * Gets partner display name or `undefined` if one is not set
   */
  displayName: state => partner => state.list[partner] && state.list[partner].displayName,

  /**
   * Gets partner address for the specified crypto or `undefined` if one is not set
   */
  cryptoAddress: state => (partner, crypto) => {
    if (isErc20(crypto)) {
      crypto = Cryptos.ETH
    }
    return state.list[partner] && state.list[partner][crypto]
  }
}
