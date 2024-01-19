import { Fees } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import { sortTransactionsFn } from '@/store/utils/sortTransactionsFn'

export default {
  areTransactionsLoading(state) {
    return state.areTransactionsLoading || state.areRecentLoading || state.areOlderLoading
  },
  areRecentLoading(state) {
    return state.areRecentLoading
  },
  areOlderLoading(state) {
    return state.areOlderLoading
  },

  /**
   * Returns transactions list sorted by timestamp (from the newest to the oldest)
   * @param {{transactions: Object.<string, object>}} state module state
   * @returns {Array}
   */
  sortedTransactions(state) {
    return Object.values(state.transactions).sort(sortTransactionsFn)
  },

  /**
   * Returns transactions with the specified partner.
   * This getter was added to support transactions display in chats and supposed to be removed
   * as soon as we add an endpoint to fetch transactions for chats.
   */
  partnerTransactions: (state) => (partner) =>
    Object.values(state.transactions).filter((tx) => isStringEqualCI(tx.partner, partner)),

  fee: () => (_amount) => Fees.ADM_TRANSFER
}
