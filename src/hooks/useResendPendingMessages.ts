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
  const ipfsNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/ipfs'])
  const areAdmNodesOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))
  const areIpfsNodesOnline = computed(() =>
    ipfsNodes.value.some((node) => node.status === 'online')
  )
  const pendingMessages = computed<Record<string, PendingMessage>>(
    () => store.state.chat.pendingMessages
  )

  watchImmediate([areAdmNodesOnline, areIpfsNodesOnline], ([admOnline, ipfsOnline]) => {
    const hasMessagesWithFiles = Object.values(pendingMessages.value).some(
      (message) => message.files && message.files.length > 0
    )

    const isReady = hasMessagesWithFiles ? admOnline && ipfsOnline : admOnline

    if (!isReady) return

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
