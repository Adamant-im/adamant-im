import baseActions from '../btc-base/btc-base-actions'
import DogeApi from '../../../lib/bitcoin/doge-api'

const TX_FETCH_INTERVAL = 30 * 1000

const getNewTransactions = (api, context) => {
  context.commit('areRecentLoading', true)
  return api.getTransactions({ }).then(
    result => {
      context.commit('areRecentLoading', false)
      context.commit('transactions', result.items)
    },
    error => {
      context.commit('areRecentLoading', false)
      return Promise.reject(error)
    }
  )
}

const getOldTransactions = (api, context) => {
  const from = Object.keys(context.state.transactions).length
  context.commit('areOlderLoading', true)
  return api.getTransactions({ from }).then(
    result => {
      context.commit('areOlderLoading', false)
      context.commit('transactions', result.items)
      if (!result.hasMore) {
        context.commit('bottom')
      }
    },
    error => {
      context.commit('areOlderLoading', false)
      return Promise.reject(error)
    }
  )
}

export default {
  ...baseActions({
    apiCtor: DogeApi,
    getOldTransactions,
    getNewTransactions,
    fetchRetryTimeout: TX_FETCH_INTERVAL
  })
}
