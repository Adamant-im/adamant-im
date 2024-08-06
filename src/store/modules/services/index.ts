import { state } from './services-state'
import { actions } from './services-actions'
import { mutations } from './services-mutations'
import { getters } from './services-getters'
import { Module } from 'vuex'
import { RootState } from '@/store/types'
import { ServicesState } from '@/store/modules/services/types'

const servicesModule: Module<ServicesState, RootState> = {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
}

export default servicesModule
