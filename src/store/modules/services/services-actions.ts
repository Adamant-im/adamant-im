import { services } from '@/lib/nodes/services'
import { ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState, TogglePayload } from '@/store/modules/services/types'

export const actions: ActionTree<ServicesState, RootState> = {
  updateStatus() {
    for (const [, client] of Object.entries(services)) {
      client.checkHealth()
    }
  },

  toggle(context, payload: TogglePayload) {
    context.commit('toggle', payload)
  },

  useFastestService(context, payload: boolean) {
    context.commit('useFastestService', payload)
  }
}
