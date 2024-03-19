import { actions } from './bot-commands-actions.ts'
import { mutations } from './bot-commands-mutations.ts'
import { state } from './bot-commands-state.ts'
import { getters } from './bot-commands-getters.ts'
import { Module } from 'vuex'
import { RootState } from '@/store/types'
import { BotCommandsState } from '@/store/modules/bot-commands/types.ts'

const bodCommandsModule: Module<BotCommandsState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

export default bodCommandsModule
