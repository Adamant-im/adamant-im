import baseActions from '../btc-base/btc-base-actions'
import DogeApi from '../../../lib/bitcoin/doge-api'
import { CryptosInfo } from '@/lib/constants/index.js'

const getNewTransactions = async (api, context) => {
  context.commit('areRecentLoading', true)
  const result = await api.getTransactions({})
  if (result) {
    context.commit('transactions', result.items)
  }
  context.commit('areRecentLoading', false)
}

const getOldTransactions = async (api, context) => {
  // If we already have the most old transaction for this address, no need to request anything
  if (context.state.bottomReached) return Promise.resolve()

  // Offset must be based on confirmed transactions only: locally created
  // pending transactions are stored in the same map but never exist for
  // the indexer, so counting them shifts the offset and skips real history
  const from = Object.values(context.state.transactions).filter(
    (tx) => tx.status !== 'PENDING'
  ).length

  context.commit('areOlderLoading', true)
  const result = await api.getTransactions({ from })
  if (result) {
    context.commit('transactions', result.items)
    if (!result.hasMore) {
      context.commit('bottom', true)
    }
  }
  context.commit('areOlderLoading', false)
}

export default {
  ...baseActions({
    apiCtor: DogeApi,
    balanceCheckInterval: CryptosInfo.DOGE.balanceCheckInterval,
    balanceValidInterval: CryptosInfo.DOGE.balanceValidInterval,
    getOldTransactions,
    getNewTransactions
  })
}
