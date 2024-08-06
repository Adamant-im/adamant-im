import { MutationTree } from 'vuex'
import { ServicesState, StatusPayload, TogglePayload } from '@/store/modules/services/types'

export const mutations: MutationTree<ServicesState> = {
  useFastestService(state, value: boolean) {
    state.useFastestService = value
  },

  toggle(state, payload: TogglePayload) {
    if (!state[payload.type]) {
      state[payload.type] = {}
    }
    const node = state[payload.type][payload.url]
    if (node) {
      node.active = payload.active
    }
  },

  status(state, { status, serviceType }: StatusPayload) {
    if (!state[serviceType]) {
      state[serviceType] = {}
    }
    state[serviceType][status.url] = status
  }
}
