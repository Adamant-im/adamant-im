import { GetterTree } from 'vuex'
import { RootState } from '@/store/types'
import { RateState } from '@/store/modules/rate/types'

export const getters: GetterTree<RateState, RootState> = {
  ratesBySeconds: (state) => (timestamp: number) => {
    return state.historyRates[timestamp];
  },
  historyRateAmount: (state, { ratesBySeconds }) => (timestamp: number, amount: number, crypto: string, currency: string) => {
    return ratesBySeconds(timestamp)[`${crypto}/${currency}`] * amount
  },
  historyRate:
    (state, { ratesBySeconds, historyRateAmount }, rootState) => (timestamp: number, amount: number, crypto: string) => {
      const fiatCurrency = rootState.options.currentRate

      const calculatedRatesBySeconds = ratesBySeconds(timestamp);

      if (calculatedRatesBySeconds) {
        const calculatedHistoryAmount = historyRateAmount(timestamp, amount, crypto, fiatCurrency);

        if (!isNaN(calculatedHistoryAmount)) {
          return  `${calculatedHistoryAmount.toFixed(
            2
          )} ${fiatCurrency}`
        }
      }

      return  `� ${fiatCurrency}`
    },
  rate: (state, getters, rootState) => (amount: number, crypto: string) => {
    const currentCurrency = rootState.options.currentRate
    const store = state.rates[`${crypto}/${currentCurrency}`]
    const rate = store * amount
    return isNaN(rate) ? '�' : `${rate.toFixed(2)} ${currentCurrency}`
  }
}
