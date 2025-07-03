import { computed } from 'vue'
import { useStore } from 'vuex'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'

export function useConsiderOffline() {
  const store = useStore()

  const isOnline = computed(() => store.getters['isOnline'])

  const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
  const coinNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/coins'])
  const servicesNodes = computed<NodeStatusResult[]>(() => store.getters['services/services'])
  const ipfsNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/ipfs'])

  const allNodes = computed<NodeStatusResult[]>(() => [
    ...admNodes.value,
    ...coinNodes.value,
    ...servicesNodes.value,
    ...ipfsNodes.value
  ])

  const everyNodeDisabled = computed(() =>
    allNodes.value.every((node) => node.status === 'disabled')
  )
  const anyNodeOnline = computed(() => allNodes.value.some((node) => node.status === 'online'))

  const consideredOffline = computed(
    () =>
      !isOnline.value ||
      (!anyNodeOnline.value && !everyNodeDisabled.value) ||
      everyNodeDisabled.value
  )

  return {
    consideredOffline
  }
}
