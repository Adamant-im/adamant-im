import { MutationTree } from 'vuex'
import { BotCommand, BotCommandsState } from '@/store/modules/bot-commands/types.ts'

export const mutations: MutationTree<BotCommandsState> = {
  addCommand(state, botCommand: BotCommand): void {
    const commandValue = botCommand.command.trim()
    const botCommands = state.commands[botCommand.partnerId]
    if (!botCommands) {
      state.commands[botCommand.partnerId] = [commandValue]
    } else if (!botCommands.includes(commandValue)) {
      botCommands.push(commandValue)
    }
  }
}
