import socketClient from '@/lib/sockets'
import { cacheVerifiedPublicKey, decodeChat, getPublicKey } from '@/lib/adamant-api'
import { isStringEqualCI } from '@/lib/textHelpers'
import { logger } from '@/utils/devTools/logger'
import { isChatTransactionVisible } from '@/lib/chat/helpers/isChatTransactionVisible'

function subscribe(store) {
  socketClient.subscribe('newMessage', (transaction) => {
    if (!isChatTransactionVisible(transaction)) return

    const isIncoming = isStringEqualCI(transaction.recipientId, store.state.address)
    const counterpartyId = isIncoming ? transaction.senderId : transaction.recipientId
    const counterpartyPublicKey = isIncoming
      ? transaction.senderPublicKey
      : transaction.recipientPublicKey

    // The key still comes from the socket payload, but it is checked against the address it is
    // claimed for before it is used or cached. A node that pushes its own key together with a
    // message it encrypted itself would otherwise produce something that decrypts cleanly and
    // appears in the chat as if a trusted contact had sent it.
    //
    // The check is local arithmetic, so the realtime path makes no request at all — one fewer
    // than before, since resolving the key for an outgoing echo used to go through
    // `getPublicKey`. The fallback only runs when a node omits the key from the payload, and
    // even then `getPublicKey` answers from cache in the common case.
    let resolveKey

    if (!counterpartyPublicKey) {
      resolveKey = getPublicKey(counterpartyId)
    } else if (cacheVerifiedPublicKey(counterpartyId, counterpartyPublicKey)) {
      resolveKey = Promise.resolve(counterpartyPublicKey)
    } else {
      resolveKey = Promise.reject(
        new Error(`public key does not derive the address it is claimed for: ${counterpartyId}`)
      )
    }

    resolveKey
      .then((publicKey) => {
        const decoded = transaction.type === 0 ? transaction : decodeChat(transaction, publicKey)

        // All transactions we get via socket are shown in chats, including ADM direct transfers
        // Currently, we don't update confirmations for direct transfers, see getChats() in adamant-api.js
        // So we'll update confirmations in getTransactionStatus()

        store.dispatch('chat/pushMessages', [decoded])
      })
      .catch((error) => {
        logger.warn(
          'socketsPlugin',
          `Dropped a socket message from ${transaction.senderId}: ${error.message}`
        )
      })
  })
}

export default (store) => {
  subscribe(store)

  socketClient.setSocketEnabled(store.state.options.useSocketConnection)

  // open socket connection when chats are loaded
  store.watch(
    () => store.state.chat.isFulfilled,
    (isFulfilled) => {
      if (isFulfilled) socketClient.init(store.state.address)
    }
  )

  // when logout or update `useSocketConnection` option
  store.subscribe((mutation) => {
    if (mutation.type === 'reset') socketClient.destroy()

    if (
      mutation.type === 'options/updateOption' &&
      mutation.payload.key === 'useSocketConnection'
    ) {
      socketClient.setSocketEnabled(mutation.payload.value)
    }
  })

  // when statusUpdate/enable/disable/useFastest node
  store.subscribe((mutation) => {
    if (mutation.type === 'nodes/status' || mutation.type === 'nodes/toggle') {
      socketClient.setNodes(store.getters['nodes/adm'])
    }

    if (mutation.type === 'nodes/useFastest') {
      socketClient.setUseFastest(mutation.payload)
    }
  })
}
