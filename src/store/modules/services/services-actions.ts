import { services } from '@/lib/nodes/services'
import { ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState, TogglePayload, ToggleAllPayload } from '@/store/modules/services/types'

export const actions: ActionTree<ServicesState, RootState> = {
  updateStatus() {
    for (const [, client] of Object.entries(services)) {
      client.checkHealth()
    }
  },

  toggle(context, payload: TogglePayload) {
    context.commit('toggle', payload)
  },

  toggleAll(context, payload: ToggleAllPayload) {
    const { active } = payload
    const nodes = context.getters['services']
    Object.keys(nodes).forEach(key => {
      const node = nodes[key]
      const { label, url } = node
      context.dispatch('toggle', {type: label, url, active})
    })   
  },

  useFastestService(context, payload: boolean) {
    context.commit('useFastestService', payload)
  }
}
