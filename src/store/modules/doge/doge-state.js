import baseState from '../btc-base/btc-base-state'
import { Cryptos } from '../../../lib/constants'

export default () => ({
  crypto: Cryptos.DOGE,
  ...baseState(),
  /**
   * Node-specific pagination offset for older history, as `{ node, generation, offset }`.
   * An offset is valid only within the dataset of the indexer that produced it.
   * When the node or session generation changes, the offset is reset to zero,
   * any node-specific `bottomReached` latch is cleared, and pagination restarts from the top.
   */
  oldTxState: null
})
