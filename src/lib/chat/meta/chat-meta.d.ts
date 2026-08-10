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

export const WELCOME_CHAT_ID: 'chats.virtual.welcome_message_title'
export const BOUNTY_WALLET_CHAT_ID: 'U15423595369615486571'
export const BOUNTY_FOUNDATION_WALLET_CHAT_ID: 'U1835325601873095435'
export const EXCHANGE_BOT_CHAT_ID: 'U5149447931090026688'
export const BOUNTY_BOT_CHAT_ID: 'U1644771796259136854'
export const DONATE_BOT_CHAT_ID: 'U380651761819723095'
export const BITCOIN_BET_CHAT_ID: 'U17840858470710371662'
export const ADELINA_AI_CHAT_ID: 'U11138426591213238985'

export const ADAMANT_CHATS_META: AdamantChatsMap
