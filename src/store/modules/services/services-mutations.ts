import { MutationTree } from 'vuex'
import { AvailableService, ServicesState } from '@/store/modules/services/types'

type StatusPayload = { serviceType: AvailableService; status: { url: string; active: boolean } }
type TogglePayload = { type: AvailableService; url: string; active: boolean }

export const mutations: MutationTree<ServicesState> = {
  useFastestService(state, value) {
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
