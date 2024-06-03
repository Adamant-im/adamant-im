import { ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import { BotCommand, BotCommandsState } from '@/store/modules/bot-commands/types'
import { extractCommandsFromMessages } from '@/store/modules/bot-commands/utils/extractCommandsFromMessages'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

export const actions: ActionTree<BotCommandsState, RootState> = {
  addBotCommand({ commit }, value: BotCommand): void {
    commit('addCommand', value)
  },
  reInitCommands({ commit }, messages: NormalizedChatMessageTransaction[]) {
    if (messages && messages.length > 0) {
      const chats = Object.groupBy(messages, ({ recipientId }) => recipientId)
      for (const recipientId in chats) {
        const chatMessages = chats[recipientId]
        if (Array.isArray(chatMessages)) {
          const commands = extractCommandsFromMessages(recipientId, chatMessages)
          if (commands.length > 0) {
            commit('initCommands', {
              partnerId: recipientId,
              commands
            })
          }
        }
      }
    }
  }
}
