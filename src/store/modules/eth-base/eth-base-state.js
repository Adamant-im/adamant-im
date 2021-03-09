export default () => ({
  balance: 0,
  address: '',
  publicKey: null,
  privateKey: null,
  areOlderLoading: false,
  areRecentLoading: false,
  transactions: { },
  areTransactionsLoading: false,
  minHeight: Infinity,
  maxHeight: -1,
  bottomReached: false
})
