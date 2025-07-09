import { useStore } from 'vuex'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { useNow } from '@vueuse/core'
import Visibility from 'visibilityjs'

export function useChatsSpinner() {
  const store = useStore()
  const { now, pause, resume } = useNow({ interval: 500, controls: true })

  const visibilityId = ref<number | boolean | null>(null)

  const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
  const admNodesOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))
  const chatsActualUntil = computed(() => store.state.chat.chatsActualUntil)
  const currentTime = computed(() => now.value.getTime())
  const chatsActual = computed(() => chatsActualUntil.value > currentTime.value)

  onMounted(() => {
    visibilityId.value = Visibility.change((event, state) => {
      if (state === 'visible') {
        resume()
      } else {
        pause()
      }
    })
  })

  onUnmounted(() => {
    Visibility.unbind(Number(visibilityId.value))
  })

  return computed(() => !admNodesOnline.value || !chatsActual.value)
}
