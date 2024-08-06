import baseActions from '../btc-base/btc-base-actions'
import DashApi from '../../../lib/bitcoin/dash-api'

/**
 * Fetches DASH transactions. Paging is not supported at the moment.
 *
 * @param {DashApi} api API client
 * @param {*} context Vuex context
 */
const getNewTransactions = (api, context) => {
  const excludes = Object.keys(context.state.transactions)

  context.commit('areRecentLoading', true)
  return api.getTransactions({ excludes }).then(
    (result) => {
      context.commit('areRecentLoading', false)
      context.commit('transactions', result.items)
      context.commit('bottom', true)
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

  const excludes = Object.keys(context.state.transactions)

  context.commit('areOlderLoading', true)
  return api.getTransactions({ excludes }).then(
    (result) => {
      context.commit('areOlderLoading', false)
      context.commit('transactions', result.items)
      context.commit('bottom', true)
    },
    (error) => {
      context.commit('areOlderLoading', false)
      return Promise.reject(error)
    }
  )
}

export default {
  ...baseActions({
    apiCtor: DashApi,
    getOldTransactions,
    getNewTransactions
  })
}
