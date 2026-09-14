import socketClient from '@/lib/sockets'
import { cacheVerifiedPublicKey, decodeChat, getPublicKey } from '@/lib/adamant-api'
import { Transactions, TransactionStatus } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import { logger } from '@/utils/devTools/logger'
import { isChatTransactionVisible } from '@/lib/chat/helpers/isChatTransactionVisible'

function subscribe(store) {
  socketClient.subscribe('newMessage', (transaction) => {
    if (
      !transaction?.id ||
      ![Transactions.SEND, Transactions.CHAT_MESSAGE].includes(transaction.type)
    )
      return
    if (!isChatTransactionVisible(transaction)) return
    if (transaction.type === Transactions.SEND && !(Number(transaction.amount) > 0)) return

    const accountAddress = store.state.address
    const isIncoming = isStringEqualCI(transaction.recipientId, accountAddress)
    if (!isIncoming && !isStringEqualCI(transaction.senderId, accountAddress)) return
    const isIncomingAdmTransfer = isIncoming && Number(transaction.amount) > 0
    const asProvisionalTransaction = (decodedTransaction) =>
      isIncomingAdmTransfer
        ? {
            ...decodedTransaction,
            confirmations: 0,
            height: 0,
            status: TransactionStatus.REGISTERED
          }
        : decodedTransaction

    const pushSocketTransaction = (decodedTransaction) => {
      if (store.state.address !== accountAddress) return

      // A delayed socket echo must not replace a REST result or the first-seen transfer fields.
      // REST polling and the transaction query own reconciliation after initial delivery.
      if (
        Number(transaction.amount) > 0 &&
        Object.values(store.state.chat.chats || {}).some((chat) =>
          chat.messages?.some((message) => message.id === transaction.id)
        )
      ) {
        return
      }

      store.dispatch('chat/pushNewMessages', [asProvisionalTransaction(decodedTransaction)])
    }

    if (transaction.type === Transactions.SEND) {
      // Realtime value-bearing transactions are provisional. Show incoming transfers immediately,
      // but never trust socket-supplied confirmation metadata; REST reconciliation decides whether
      // they become confirmed or invalid.
      pushSocketTransaction(transaction)
      return
    }

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
        const decoded = decodeChat(transaction, publicKey)

        // Socket transactions are provisional; polling reconciles their confirmed state.

        pushSocketTransaction(decoded)
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

  socketClient.setNodes(store.getters['nodes/adm'])
  socketClient.setUseFastest(store.state.nodes.useFastestAdmNode)
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

    if (mutation.type === 'nodes/useFastestAdmNode') {
      socketClient.setUseFastest(mutation.payload)
    }
  })
}
