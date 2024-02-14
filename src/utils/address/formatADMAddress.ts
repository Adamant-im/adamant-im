/**
 * Format ADM address
 *
 * @param admAddress ADM address
 * @param chatName Chat name
 */
export function formatADMAddress(admAddress: string, chatName = '') {
  let result = ''
  if (chatName !== '' && chatName !== undefined) {
    result = chatName + ' (' + admAddress + ')'
  } else {
    result = admAddress
  }
  return result
}
