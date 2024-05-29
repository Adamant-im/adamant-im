import { RateState } from '@/store/modules/rate/types.ts'

export const state: RateState = {
  rates: {},
  isLoaded: false,
  historyRates: {}
}
