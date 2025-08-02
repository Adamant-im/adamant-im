import { computed, watch } from 'vue'
import { GetterTree, useStore } from 'vuex'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { RootState } from '@/store/types'

export function useConsiderOffline(options?: { getters: GetterTree<any, RootState> }) {
  const getters = options?.getters ?? useStore().getters

  const isOnline = computed(() => getters['isOnline'])

  const admNodes = computed<NodeStatusResult[]>(() => getters['nodes/adm'])
  const coinNodes = computed<NodeStatusResult[]>(() => getters['nodes/coins'])
  const servicesNodes = computed<NodeStatusResult[]>(() => getters['services/services'])
  const ipfsNodes = computed<NodeStatusResult[]>(() => getters['nodes/ipfs'])

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

  const offlineHandlers = new Set<() => void>()

  const subscribeOffline = (callback: () => void) => {
    offlineHandlers.add(callback)

    return () => {
      offlineHandlers.delete(callback)
    }
  }

  const unsubscribeOffline = (callback: () => void) => {
    offlineHandlers.delete(callback)
  }

  watch(consideredOffline, (isOffline) => {
    if (isOffline) {
      offlineHandlers.forEach((cb) => cb())
    }
  })

  return {
    consideredOffline,
    subscribeOffline,
    unsubscribeOffline
  }
}
