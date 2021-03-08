import baseActions from '../btc-base/btc-base-actions'
import DashApi from '../../../lib/bitcoin/dash-api'

const TX_FETCH_INTERVAL = 30 * 1000

/**
 * Fetches DASH transactions. Paging is not supported at the moment.
 *
 * @param {DashApi} api API client
 * @param {*} context Vuex context
 */
const getTransactions = (api, context) => {
  const excludes = Object.keys(context.state.transactions)

  context.commit('areRecentLoading', true)
  return api.getTransactions({ excludes }).then(
    result => {
      context.commit('areRecentLoading', false)
      context.commit('transactions', result.items)
      context.commit('bottom')
    },
    error => {
      context.commit('areRecentLoading', false)
      return Promise.reject(error)
    }
  )
}

export default {
  ...baseActions({
    apiCtor: DashApi,
    getOldTransactions: getTransactions,
    getNewTransactions: getTransactions,
    fetchRetryTimeout: TX_FETCH_INTERVAL
  })
}
