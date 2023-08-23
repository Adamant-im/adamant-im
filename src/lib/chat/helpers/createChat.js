/**
 * Create empty chat.
 */
export function createChat() {
  return {
    messages: [],
    numOfNewMessages: 0,
    scrollPosition: undefined,
    offset: 0,
    page: 0
  }
}
