import { FetchStatus } from '@/lib/constants'

export default () => ({
  balance: 0,
  balanceStatus: FetchStatus.Loading,
  balanceActualUntil: 0,
  address: '',
  publicKey: null,
  privateKey: null,
  areOlderLoading: false,
  areRecentLoading: false,
  transactions: {},
  transactionsCount: 0, // browser stores ints, but fails with objects and arrays
  areTransactionsLoading: false,
  minHeight: Infinity,
  maxHeight: -1,
  /**
   * How far a group of transactions sharing one block timestamp has been read,
   * as `{ time, offset }`, when it did not fit into a single update. Only one
   * group can ever be pending: an unresolved one blocks the boundary it sits on
   */
  timestampGroupCursor: null,
  bottomReached: false,
  /**
   * Identity of the indexer history session that owns the pagination boundaries,
   * as `{ node, generation }`. ETH timestamp boundaries are meaningful only for
   * the dataset that produced them and must be reset when affinity changes.
   */
  historySession: null
})
