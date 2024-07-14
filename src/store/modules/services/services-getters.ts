import { GetterTree } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState } from '@/store/modules/services/types'

export const getters: GetterTree<ServicesState, RootState> = {
  rate(state) {
    return Object.values(state.ratesInfo)
  },
  services(state, getters) {
    return [...getters.rate]
  }
}
