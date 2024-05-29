import { state } from './services-state.ts'
import { actions } from './services-actions.ts'
import { mutations } from './services-mutations.ts'
import { getters } from './services-getters.ts'
import { Module } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState } from '@/store/modules/services/types.ts'

const servicesModule: Module<ServicesState, RootState> = {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
}

export default servicesModule
