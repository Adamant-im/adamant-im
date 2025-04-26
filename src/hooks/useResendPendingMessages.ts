import { computed, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { watchImmediate } from '@vueuse/core'
import { isAllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { TransactionStatus as TS } from '@/lib/constants'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'

type PendingMessage = {
  recipientId: string
  timeout: ReturnType<typeof setTimeout>
}

export function useResendPendingMessages() {
  const store = useStore()

  const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
  const admNodesOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))
  const pendingMessages = computed<Record<string, PendingMessage>>(
    () => store.state.chat.pendingMessages
  )

  watchImmediate(admNodesOnline, (newVal) => {
    if (newVal) {
      Object.entries(pendingMessages.value).forEach(([messageId, message]) => {
        store
          .dispatch('chat/resendMessage', {
            messageId,
            recipientId: message.recipientId!
          })
          .then((res) => {
            if (res.success) {
              store.commit('chat/deletePendingMessage', messageId)
            }
          })
          .catch((err) => {
            if (!isAllNodesOfflineError(err)) {
              store.commit('chat/updateMessage', {
                id: messageId,
                status: TS.REJECTED,
                partnerId: message.recipientId!
              })

              store.commit('chat/deletePendingMessage', messageId)
            }
          })
      })
    }
  })

  onBeforeUnmount(() => {
    Object.values(pendingMessages.value).forEach((message) => {
      clearTimeout(message.timeout)
    })
  })
}
