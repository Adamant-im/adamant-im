import { computed, onBeforeUnmount, watch } from 'vue'
import { useStore } from 'vuex'
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

  // resend basic messages
  function resendBasic() {
    Object.entries(pendingMessages.value).forEach(([id, msg]) => {
      if (msg.type === MessageType.BASIC_ENCRYPTED_MESSAGE) {
        store
          .dispatch('chat/resendMessage', {
            recipientId: msg.recipientId,
            messageId: id
          })
          .then((res) => {
            if (res.success) store.commit('chat/deletePendingMessage', id)
          })
      }
    })
  }

  // resend messages with attachments (requires ipfs node)
  function resendAttachments() {
    Object.entries(pendingMessages.value).forEach(([id, msg]) => {
      if (msg.type !== MessageType.BASIC_ENCRYPTED_MESSAGE && msg.files?.length) {
        store
          .dispatch('chat/resendAttachment', {
            recipientId: msg.recipientId,
            files: msg.files,
            messageId: id
          })
          .then((res) => {
            if (res.success) store.commit('chat/deletePendingMessage', id)
          })
      }
    })
  }

  watch(
    areAdmNodesOnline,
    (isUp, wasUp) => {
      if (!isUp || isUp === wasUp) return

      resendBasic()
      if (areIpfsNodesOnline.value) {
        resendAttachments()
      }
    },
    { immediate: true }
  )

  watch(
    areIpfsNodesOnline,
    (isUp, wasUp) => {
      if (!isUp || isUp === wasUp) return
      if (!areAdmNodesOnline.value) return

      resendAttachments()
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    Object.values(pendingMessages.value).forEach((message) => {
      clearTimeout(message.timeout)
    })
  })
}
