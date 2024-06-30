import { GetterTree } from 'vuex'
import { RootState } from '@/store/types'
import { BotCommandsState } from '@/store/modules/bot-commands/types'

export const getters: GetterTree<BotCommandsState, RootState> = {
  getCommandsHistory: (state) => (parentId: string) => {
    return state.commands[parentId] || []
  }
}
