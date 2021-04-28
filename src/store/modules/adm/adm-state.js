export default () => {
  return {
    address: '',
    areTransactionsLoading: false,
    areRecentLoading: false,
    areOlderLoading: false,
    transactions: {},
    transactionsCount: 0, // browser stores ints, but fails with objects and arrays
    maxHeight: -1,
    minHeight: Infinity,
    bottomReached: false
  }
}
