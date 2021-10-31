export default () => ({
  address: '',
  balance: 0,
  nonce: 0,
  transactions: { },
  transactionsCount: 0, // browser stores ints, but fails with objects and arrays
  areOlderLoading: false,
  areRecentLoading: false,
  areTransactionsLoading: false,
  maxTimestamp: -1,
  minTimestamp: Infinity,
  bottomReached: false
})
