export const WELCOME_CHAT_ID = 'chats.virtual.welcome_message_title'
export const BOUNTY_WALLET_CHAT_ID = 'U15423595369615486571'
export const BOUNTY_FOUNDATION_WALLET_CHAT_ID = 'U1835325601873095435'
export const EXCHANGE_BOT_CHAT_ID = 'U5149447931090026688'
export const BOUNTY_BOT_CHAT_ID = 'U1644771796259136854'
export const DONATE_BOT_CHAT_ID = 'U380651761819723095'
export const BITCOIN_BET_CHAT_ID = 'U17840858470710371662'
export const ADELINA_AI_CHAT_ID = 'U11138426591213238985'

export const ADAMANT_CHATS_META = {
  [WELCOME_CHAT_ID]: {
    displayName: 'chats.virtual.welcome_message_title',
    ableToSendMessage: false,
    staticChat: true,
    welcomeMessage: 'chats.virtual.welcome_message'
  },

  [BOUNTY_WALLET_CHAT_ID]: {
    displayName: 'chats.virtual.bounty_wallet_title',
    ableToSendMessage: true,
    staticChat: true
  },

  [BOUNTY_FOUNDATION_WALLET_CHAT_ID]: {
    displayName: 'chats.virtual.bounty_foundation_wallet_title'
  },

  [EXCHANGE_BOT_CHAT_ID]: {
    displayName: 'chats.virtual.exchange_bot_title',
    ableToSendMessage: true,
    staticChat: true,
    welcomeMessage: 'chats.virtual.exchange_bot'
  },

  [BOUNTY_BOT_CHAT_ID]: {
    displayName: 'chats.virtual.bounty_bot_title',
    ableToSendMessage: true,
    staticChat: false,
    welcomeMessage: 'chats.virtual.bounty_bot'
  },

  [DONATE_BOT_CHAT_ID]: {
    displayName: 'chats.virtual.donate_bot_title',
    ableToSendMessage: true,
    staticChat: true,
    welcomeMessage: 'chats.virtual.donate_bot'
  },

  [BITCOIN_BET_CHAT_ID]: {
    displayName: 'chats.virtual.bitcoin_bet_title',
    ableToSendMessage: true,
    staticChat: true
  },

  [ADELINA_AI_CHAT_ID]: {
    displayName: 'chats.virtual.adelina_title',
    ableToSendMessage: true,
    staticChat: true,
    welcomeMessage: 'chats.virtual.adelina'
  }
}
