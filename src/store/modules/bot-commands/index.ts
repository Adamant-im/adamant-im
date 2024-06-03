import { actions } from './bot-commands-actions'
import { mutations } from './bot-commands-mutations'
import { state } from './bot-commands-state'
import { getters } from './bot-commands-getters'
import { Module } from 'vuex'
import { RootState } from '@/store/types'
import { BotCommandsState } from '@/store/modules/bot-commands/types'

const bodCommandsModule: Module<BotCommandsState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

export default bodCommandsModule
