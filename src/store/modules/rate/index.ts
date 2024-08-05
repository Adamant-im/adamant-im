import { Module } from 'vuex'
import { RootState } from '@/store/types'
import { RateState } from '@/store/modules/rate/types'
import { state } from '@/store/modules/rate/rate-state'
import { mutations } from '@/store/modules/rate/rate-mutations'
import { actions } from '@/store/modules/rate/rate-actions'
import { getters } from '@/store/modules/rate/rate-getters'

const rateModule: Module<RateState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

export default rateModule
