import baseActions from '../btc-base/btc-base-actions'
import DashApi from '../../../lib/bitcoin/dash-api'

/**
 * Fetches DASH transactions. Paging is not supported at the moment.
 *
 * @param {DashApi} api API client
 * @param {*} context Vuex context
 */
const getTransactions = (api, context) => {
  const excludes = Object.keys(context.state.transactions)

  return api.getTransactions({ excludes }).then(result => {
    context.commit('transactions', result.items)
    context.commit('bottom')
  })
}

export default {
  ...baseActions({
    apiCtor: DashApi,
    getOldTransactions: getTransactions,
    getNewTransactions: getTransactions
  })
}
