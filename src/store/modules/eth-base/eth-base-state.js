import { FetchStatus } from '@/lib/constants'

export default () => ({
  balance: 0,
  balanceStatus: FetchStatus.Loading,
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
  bottomReached: false
})
