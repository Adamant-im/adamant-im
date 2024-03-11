import { MutationTree } from 'vuex'
import { BotCommand, BotCommandsState } from '@/store/modules/bot-commands/types.ts'

export const mutations: MutationTree<BotCommandsState> = {
  addCommand(state, botCommand: BotCommand): void {
    const commandValue = botCommand.command.trim()
    if (!state.commands[botCommand.partnerId]) {
      state.commands[botCommand.partnerId] = [commandValue]
    } else {
      if (!state.commands[botCommand.partnerId].includes(commandValue)) {
        state.commands[botCommand.partnerId].push(commandValue)
      }
    }
  }
}
