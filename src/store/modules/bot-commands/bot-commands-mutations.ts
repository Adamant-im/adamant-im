import { MutationTree } from 'vuex'
import { BotCommand, BotCommandsState } from '@/store/modules/bot-commands/types.ts'
import { uniq } from 'lodash'

export const mutations: MutationTree<BotCommandsState> = {
  addCommand(state, botCommand: BotCommand): void {
    const commandValue = botCommand.command.trim()
    let botCommands = state.commands[botCommand.partnerId]
    if (!botCommands) {
      botCommands = [commandValue]
    } else {
      const index = botCommands.indexOf(commandValue)
      if (index >= 0) {
        botCommands.splice(index, 1)
      }
      botCommands.push(commandValue)
    }
    state.commands[botCommand.partnerId] = botCommands
  },

  initCommands(state, { partnerId, commands }: { partnerId: string; commands: string[] }): void {
    const botCommands = state.commands[partnerId]
    if (!botCommands) {
      state.commands[partnerId] = uniq(commands)
    }
  }
}
