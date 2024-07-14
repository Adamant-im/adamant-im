import { services } from '@/lib/nodes/services'
import { ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState } from '@/store/modules/services/types'

export const actions: ActionTree<ServicesState, RootState> = {
  updateStatus() {
    for (const [, client] of Object.entries(services)) {
      client.checkHealth()
    }
  },

  toggle(context, payload) {
    context.commit('toggle', payload)
  },

  useFastestService(context, payload) {
    context.commit('useFastestService', payload)
  }
}
