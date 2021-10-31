export default () => {
  return {
    address: '',
    areTransactionsLoading: false,
    areRecentLoading: false,
    areOlderLoading: false,
    transactions: {},
    transactionsCount: 0, // browser stores ints, but fails with objects and arrays
    addressesValidated: false, // if crypto addresses in KVS checked for consistency for this account
    validatedCryptos: {},
    maxHeight: -1,
    minHeight: Infinity,
    bottomReached: false
  }
}
