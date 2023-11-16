import { FetchStatus } from '@/lib/constants'

export default () => ({
  address: '',
  areOlderLoading: false,
  areRecentLoading: false,
  areTransactionsLoading: false,
  balance: 0,
  balanceStatus: FetchStatus.Loading,
  bottomReached: false,
  isTransactionInProcess: false,
  maxHeight: -1,
  minHeight: Infinity,
  privateKey: null,
  publicKey: null,
  transactions: {},
  transactionsCount: 0 // browser stores ints, but fails with objects and arrays
})
