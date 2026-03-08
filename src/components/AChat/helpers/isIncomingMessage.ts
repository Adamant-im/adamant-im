import { isStringEqualCI } from '@/lib/textHelpers'

export const isIncomingMessage = (senderId: string, currentUserId: string) => {
  return !isStringEqualCI(senderId, currentUserId)
}
