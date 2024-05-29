import { MutationTree } from 'vuex'
import { AvailableService, ServicesState } from '@/store/modules/services/types.ts'

export const mutations: MutationTree<ServicesState> = {
  useFastestService(state, value) {
    state.useFastestService = value
  },

  toggle(state, payload: { type: AvailableService; url: string; active: boolean }) {
    if (!state[payload.type]) {
      state[payload.type] = {}
    }
    const node = state[payload.type][payload.url]
    if (node) {
      node.active = payload.active
    }
  },

  status(
    state,
    {
      status,
      serviceType
    }: { serviceType: AvailableService; status: { url: string; active: boolean } }
  ) {
    if (!state[serviceType]) {
      state[serviceType] = {}
    }
    state[serviceType][status.url] = status
  }
}
