import { FetchStatus } from '@/lib/constants'

export default () => ({
  address: '',
  areOlderLoading: false,
  areRecentLoading: false,
  areTransactionsLoading: false,
  balance: 0,
  balanceStatus: FetchStatus.Loading,
  bottomReached: false,
  transactions: {}
})
