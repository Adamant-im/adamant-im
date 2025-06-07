import baseActions from '../btc-base/btc-base-actions'
import DashApi from '../../../lib/bitcoin/dash-api'
import { CryptosInfo } from '@/lib/constants/index.js'

/**
 * Fetches DASH transactions. Paging is not supported at the moment.
 *
 * @param {DashApi} api API client
 * @param {*} context Vuex context
 */
const getNewTransactions = async (api, context) => {
  const excludes = Object.keys(context.state.transactions)

  context.commit('areRecentLoading', true)

  const result = await api.getTransactions({ excludes })

  if (result) {
    context.commit('transactions', result.items)
    context.commit('bottom', true)
  }

  context.commit('areRecentLoading', false)
}

const getOldTransactions = async (api, context) => {
  // If we already have the most old transaction for this address, no need to request anything
  if (context.state.bottomReached) return Promise.resolve()

  const excludes = Object.keys(context.state.transactions)

  context.commit('areOlderLoading', true)

  const result = await api.getTransactions({ excludes })

  if (result) {
    context.commit('transactions', result.items)
    context.commit('bottom', true)
  }

  context.commit('areOlderLoading', false)
}

export default {
  ...baseActions({
    apiCtor: DashApi,
    balanceCheckInterval: CryptosInfo.DASH.balanceCheckInterval,
    balanceValidInterval: CryptosInfo.DASH.balanceValidInterval,
    getOldTransactions,
    getNewTransactions
  })
}
