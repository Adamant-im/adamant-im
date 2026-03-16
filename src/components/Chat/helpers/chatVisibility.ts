type ChatVisibilityParams = {
  isAdamantChat: boolean
  isStaticChat: boolean
  messagesCount: number
}

export const shouldDisplayChat = ({
  isAdamantChat,
  isStaticChat,
  messagesCount
}: ChatVisibilityParams) => {
  const isUserChat = !isAdamantChat
  const isAdamantChatWithHistory = isAdamantChat && messagesCount > 1

  return isUserChat || isStaticChat || isAdamantChatWithHistory
}
