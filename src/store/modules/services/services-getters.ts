import { GetterTree } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState } from '@/store/modules/services/types.ts'

export const getters: GetterTree<ServicesState, RootState> = {
  rate(state) {
    return Object.values(state['rates-info'])
  },
  services(state, getters) {
    return [...getters.rate]
  }
}
