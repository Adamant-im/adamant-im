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

  const admAnyOnline = computed(() => admNodes.value.some((node) => node.status === 'online'))
  const admAllDisabled = computed(() => admNodes.value.every((node) => node.status === 'disabled'))

  const anyNodeOnline = computed(() => allNodes.value.some((node) => node.status === 'online'))
  const everyNodeDisabled = computed(() =>
    allNodes.value.every((node) => node.status === 'disabled')
  )

  const consideredOffline = computed(() => {
    if (!isOnline.value) {
      return true
    }

    if (admAnyOnline.value) {
      return false
    }

    if (!admAllDisabled.value && !admAnyOnline.value) {
      return true
    }

    return !anyNodeOnline.value || everyNodeDisabled.value
  })

  return {
    consideredOffline
  }
}
