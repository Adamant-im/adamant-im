import baseState from '../btc-base/btc-base-state'
import { Cryptos } from '../../../lib/constants'

export default () => ({
  crypto: Cryptos.BTC,
  ...baseState(),
  utxo: [],
  feeRate: 0,
  height: 0,
  /**
   * An unfinished walk towards the previously known history, as
   * `{ target, cursor }`. The indexer is paged by "everything older than this
   * txid", which cannot be recomputed from the store once new records are in it,
   * so a walk stopped by the page cap has to carry its own resume point
   */
  newTxCatchUp: null,
  /**
   * Node-specific pagination cursor for older history, as `{ node, generation, cursor }`.
   * A cursor is an Esplora txid valid only within the dataset of the indexer that produced it.
   * When the node or session generation changes, the cursor is discarded and the replacement node
   * restarts from the safe boundary (top of history, `toTx: undefined`), and any node-specific
   * `bottomReached` latch is cleared.
   */
  oldTxState: null
})
