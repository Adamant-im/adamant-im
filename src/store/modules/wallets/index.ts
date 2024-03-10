import { actions } from './wallets-actions'
import { mutations } from './wallets-mutations'
import { state } from './wallets-state'
import { getters } from './wallets-getters'
import { Module } from 'vuex'
import { WalletsState } from '@/store/modules/wallets/types'
import { RootState } from '@/store/types'

const walletsModule: Module<WalletsState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

export default walletsModule
