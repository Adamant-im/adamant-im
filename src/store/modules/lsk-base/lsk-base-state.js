export default () => ({
  address: '',
  balance: 0,
  transactions: { },
  areOlderLoading: false,
  areRecentLoading: false,
  areTransactionsLoading: false,
  maxTimestamp: -1,
  minTimestamp: Infinity,
  bottomReached: false
})
