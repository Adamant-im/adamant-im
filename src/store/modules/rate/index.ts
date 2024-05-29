import { Module } from 'vuex'
import { RootState } from '@/store/types'
import { RateState } from '@/store/modules/rate/types.ts'
import { state } from '@/store/modules/rate/rate-state.ts'
import { mutations } from '@/store/modules/rate/rate-mutations.ts'
import { actions } from '@/store/modules/rate/rate-actions.ts'
import { getters } from '@/store/modules/rate/rate-getters.ts'

const rateModule: Module<RateState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

export default rateModule
