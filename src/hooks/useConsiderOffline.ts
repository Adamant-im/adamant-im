import { computed } from 'vue'
import { useStore } from 'vuex'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'

export function useConsiderOffline() {
  const store = useStore()

  const isOnline = computed(() => store.getters['isOnline'])

  const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
  const admNodesDisabled = computed(() => admNodes.value.some((node) => node.status === 'disabled'))
  const admNodesOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))

  const consideredOffline = computed(
    () => !isOnline.value || (!admNodesOnline.value && !admNodesDisabled.value)
  )

  return {
    consideredOffline
  }
}
