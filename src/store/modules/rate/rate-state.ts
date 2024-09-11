import { RateState } from '@/store/modules/rate/types'

export const state: RateState = {
  rates: {},
  isLoaded: false,
  historyRates: {}
}
