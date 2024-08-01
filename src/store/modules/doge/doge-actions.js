import baseActions from '../btc-base/btc-base-actions'
import DogeApi from '../../../lib/bitcoin/doge-api'

const getNewTransactions = (api, context) => {
  context.commit('areRecentLoading', true)
  return api.getTransactions({}).then(
    (result) => {
      context.commit('areRecentLoading', false)
      context.commit('transactions', result.items)
    },
    (error) => {
      context.commit('areRecentLoading', false)
      return Promise.reject(error)
    }
  )
}

const getOldTransactions = (api, context) => {
  // If we already have the most old transaction for this address, no need to request anything
  if (context.state.bottomReached) return Promise.resolve()

  const from = Object.keys(context.state.transactions).length
  context.commit('areOlderLoading', true)
  return api.getTransactions({ from }).then(
    (result) => {
      context.commit('areOlderLoading', false)
      context.commit('transactions', result.items)
      if (!result.hasMore) {
        context.commit('bottom', true)
      }
    },
    (error) => {
      context.commit('areOlderLoading', false)
      return Promise.reject(error)
    }
  )
}

export default {
  ...baseActions({
    apiCtor: DogeApi,
    getOldTransactions,
    getNewTransactions
  })
}
