import * as admApi from '@/lib/adamant-api'

/**
 * Retrieve the chat messages for the current account.
 * @param {number} startHeight
 * @param {number} startOffset
 * @param {boolean} recursive
 * @returns {Promise<{messages: Message[], lastMessageHeight: number}>} Array of messages
 */
export function getChats(startHeight = 0, startOffset = 0, recursive = true) {
  let allTransactions = []
  let lastMessageHeight = 0

  function loadMessages(height = 0, offset = 0) {
    return admApi.getChats(height, offset, 'asc').then((result) => {
      const { transactions, nodeTimestamp } = result
      const length = transactions.length
      const fetchedCount = result.fetchedCount ?? length

      // if no more messages
      if (fetchedCount <= 0) {
        return { transactions: allTransactions, nodeTimestamp }
      }

      allTransactions = [...allTransactions, ...transactions]

      // Advance past hidden protocol messages as well, otherwise polling asks for them again.
      lastMessageHeight = result.lastProcessedHeight ?? transactions[length - 1]?.height ?? 0

      // recursive
      if (recursive) {
        return loadMessages(height, offset + fetchedCount)
      } else {
        return { transactions: allTransactions, nodeTimestamp }
      }
    })
  }

  return loadMessages(startHeight, startOffset).then(({ transactions, nodeTimestamp }) => ({
    messages: transactions,
    lastMessageHeight: lastMessageHeight,
    nodeTimestamp
  }))
}
