export default () => {
  return {
    address: '',
    areTransactionsLoading: false,
    areRecentLoading: false,
    areOlderLoading: false,
    transactions: {},
    maxHeight: -1,
    minHeight: -1,
    bottomReached: false
  }
}
