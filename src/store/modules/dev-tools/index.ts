import type { ActionTree, GetterTree, MutationTree } from 'vuex'

import { RootState } from '@/store/types'

interface VerbosityState {
  levelAll: level[]
  levelCurrent: level
}

const actions: ActionTree<VerbosityState, RootState> = {
  setLevel({ commit }, value) {
    commit('setLevel', value)
  }
}
const getters: GetterTree<VerbosityState, RootState> = {
  levelAll: (state) => state.levelAll,
  levelCurrent: (state) => state.levelCurrent
}
const mutations: MutationTree<VerbosityState> = {
  setLevel(state, value) {
    state.levelCurrent = value
  }
}
const state = (): VerbosityState => ({
  levelAll: ['Debug', 'Info', 'Public', 'Warn'],
  levelCurrent: 'Public'
})

export type level = 'Debug' | 'Info' | 'Public' | 'Warn'

export default {
  actions,
  getters,
  mutations,
  namespaced: true,
  state
}
