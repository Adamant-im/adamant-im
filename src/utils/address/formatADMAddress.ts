/**
 * Format ADM address
 *
 * @param admAddress ADM address
 * @param chatName Chat name
 */
export function formatADMAddress(admAddress: string, chatName = '') {
  return chatName !== '' && chatName !== undefined ? chatName + ' (' + admAddress + ')' : admAddress
}
