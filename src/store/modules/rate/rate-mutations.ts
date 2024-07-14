import { MutationTree } from 'vuex'
import { Rates, RateState } from '@/store/modules/rate/types'

export const mutations: MutationTree<RateState> = {
  setRates(state, rates: Rates) {
    state.rates = rates
  },
  setHistoryRates(state, historyRates: { name: number; value: Rates }) {
    state.historyRates[historyRates.name] = historyRates.value
  },
  setLoaded(state) {
    state.isLoaded = true
  }
}
