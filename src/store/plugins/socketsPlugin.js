import socketClient from '@/lib/sockets'
import { decodeChat, getPublicKey } from '@/lib/adamant-api'

function openSocketConnection (adamantAddress, store) {
  if (!store.state.options.useSocketConnection) return
  if (socketClient.connected) return

  socketClient.connect(adamantAddress)
  socketClient.on('newTrans', transaction => {
    const promise = (transaction.recipientId === store.state.address)
      ? Promise.resolve(transaction.senderPublicKey)
      : getPublicKey(transaction.recipientId)

    promise.then(publicKey => {
      const decoded = transaction.type === 0
        ? transaction
        : decodeChat(transaction, publicKey)
      store.dispatch('chat/pushMessages', [decoded])
    })
  })
}

export default store => {
  // open socket connection when chats are loaded
  store.watch(() => store.state.chat.isFulfilled, value => {
    if (value) openSocketConnection(store.state.address, store)
  })

  // when logout or update `useSocketConnection` option
  store.subscribe((mutation, state) => {
    if (mutation.type === 'reset') {
      socketClient.disconnect()
    }

    if (mutation.type === 'options/updateOption' && mutation.payload.key === 'useSocketConnection') {
      if (mutation.payload.value) {
        openSocketConnection(state.address, store)
      } else {
        socketClient.disconnect()
      }
    }
  })
}
