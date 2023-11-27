import { FetchStatus } from '@/lib/constants'

export default () => ({
  address: '',
  balance: 0,
  balanceStatus: FetchStatus.Loading,
  transactions: {},
  areTransactionsLoading: false,
  areRecentLoading: false,
  areOlderLoading: false,
  bottomReached: false
})
