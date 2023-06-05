export type AdamantChatMeta = {
  displayName: string
  /**
   * If `false` then user is not allowed to send messages into the chat.
   */
  ableToSendMessage: boolean
  /**
   * Display chat in the list even if the user didn't chat with this bot
   * earlier.
   */
  staticChat: boolean
  /**
   * First message displayed in the chat.
   * Can contain some information about the bot, e.g. list of commands.
   * Localized. Must be an i18n key
   */
  welcomeMessage?: string
}

// the key is ADAMANT address of the chat, e.g. U123456
export type AdamantChatsMap = Record<string, AdamantChatMeta>

export const ADAMANT_CHATS_META: AdamantChatsMap
