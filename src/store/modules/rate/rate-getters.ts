import { GetterTree } from 'vuex'
import { RootState } from '@/store/types'
import { RateState } from '@/store/modules/rate/types.ts'

export const getters: GetterTree<RateState, RootState> = {
  historyRate:
    (state, getters, rootState) => (timestamp: number, amount: number, crypto: string) => {
      let historyRate
      const currentCurrency = rootState.options.currentRate
      const store = state.historyRates[timestamp]
      if (store) {
        historyRate = `${(store[`${crypto}/${currentCurrency}`] * amount).toFixed(
          2
        )} ${currentCurrency}`
      } else {
        historyRate = '�'
      }
      return historyRate
    },
  rate: (state, getters, rootState) => (amount: number, crypto: string) => {
    const currentCurrency = rootState.options.currentRate
    const store = state.rates[`${crypto}/${currentCurrency}`]
    const rate = store * amount
    return isNaN(rate) ? '�' : `${rate.toFixed(2)} ${currentCurrency}`
  }
}
