import { computed, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { watchImmediate } from '@vueuse/core'
import { MessageType } from '@/lib/constants'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { FileData } from '@/lib/files'

type PendingMessage = {
  recipientId: string
  timeout: ReturnType<typeof setTimeout>
  type: number
  files?: FileData[]
}

export function useResendPendingMessages() {
  const store = useStore()

  const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
  const admNodesOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))
  const pendingMessages = computed<Record<string, PendingMessage>>(
    () => store.state.chat.pendingMessages
  )

  watchImmediate(admNodesOnline, (online) => {
    if (!online) return

    Object.entries(pendingMessages.value).forEach(([messageId, message]) => {
      ;(message.type === MessageType.BASIC_ENCRYPTED_MESSAGE
        ? store.dispatch('chat/resendMessage', {
            recipientId: message.recipientId,
            messageId
          })
        : store.dispatch('chat/resendAttachment', {
            recipientId: message.recipientId,
            files: message.files,
            messageId
          })
      ).then((res) => {
        if (res.success) {
          store.commit('chat/deletePendingMessage', messageId)
        }
      })
    })
  })

  onBeforeUnmount(() => {
    Object.values(pendingMessages.value).forEach((message) => {
      clearTimeout(message.timeout)
    })
  })
}
