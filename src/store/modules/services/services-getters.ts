import { GetterTree } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState } from '@/store/modules/services/types'
import { NODE_LABELS } from '@/lib/nodes/constants'

export const getters: GetterTree<ServicesState, RootState> = {
  rate(state) {
    return Object.values(state[NODE_LABELS.RatesInfo])
  },
  services(state, getters) {
    return [...getters.rate]
  }
}
