import { ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import { BotCommand, BotCommandsState } from '@/store/modules/bot-commands/types.ts'

export const actions: ActionTree<BotCommandsState, RootState> = {
  addBotCommand({ commit }, value: BotCommand): void {
    commit('addCommand', value)
  }
}
