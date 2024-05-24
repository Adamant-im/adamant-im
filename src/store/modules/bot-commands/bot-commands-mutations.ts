import { MutationTree } from 'vuex'
import { BotCommand, BotCommandsState } from '@/store/modules/bot-commands/types'
import { uniqCommand } from '@/store/modules/bot-commands/utils/uniqCommand'

export const mutations: MutationTree<BotCommandsState> = {
  addCommand(state, botCommand: BotCommand & { partnerId: string }): void {
    let botCommands = state.commands[botCommand.partnerId]
    if (!botCommands) {
      botCommands = [botCommand]
    } else {
      const index = botCommands.findIndex((item) => item.command === botCommand.command)
      if (index >= 0) {
        botCommands.splice(index, 1)
      }
      botCommands.push(botCommand)
    }
    state.commands[botCommand.partnerId] = botCommands
  },

  initCommands(
    state,
    { partnerId, commands }: { partnerId: string; commands: BotCommand[] }
  ): void {
    const existsCommand = state.commands[partnerId] || []
    state.commands[partnerId] = uniqCommand([...existsCommand, ...commands]).sort((a, b) => {
      const diff = a.timestamp - b.timestamp
      if (diff < 0) return -1
      if (diff > 0) return 1
      return 0
    })
  }
}
