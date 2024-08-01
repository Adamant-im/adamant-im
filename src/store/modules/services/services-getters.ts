import { GetterTree } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState } from '@/store/modules/services/types'
import { NODE_LABELS } from '@/lib/nodes/constants'

export const getters: GetterTree<ServicesState, RootState> = {
  rate(state) {
    return Object.values(state[NODE_LABELS.RatesInfo])
  },
  btcIndexer(state) {
    return Object.values(state[NODE_LABELS.BtcIndexer])
  },
  dogeIndexer(state) {
    return Object.values(state[NODE_LABELS.DogeIndexer])
  },
  ethIndexer(state) {
    return Object.values(state[NODE_LABELS.EthIndexer])
  },
  klyIndexer(state) {
    return Object.values(state[NODE_LABELS.KlyIndexer])
  },
  services(state, getters) {
    return [
      ...getters.rate,
      ...getters.btcIndexer,
      ...getters.dogeIndexer,
      ...getters.ethIndexer,
      ...getters.klyIndexer
    ]
  }
}
