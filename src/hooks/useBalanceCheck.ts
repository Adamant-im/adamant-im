import { useStore } from 'vuex'
import { useNow } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Visibility from 'visibilityjs'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'

export function useBalanceCheck() {
  const store = useStore()
  const { now } = useNow({ interval: 500, controls: true })

  const visibilityId = ref<number | boolean | null>(null)

  const isOnline = computed(() => store.getters['isOnline'])
  const coinNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/coins'])
  const areCoinNodesOnline = computed(() =>
    coinNodes.value.some((node) => node.status === 'online')
  )
  const balanceActualUntil = computed(() => store.state.balanceActualUntil)
  const currentTime = computed(() => now.value.getTime())

  const updateBalance = async () => {
    await store.dispatch('updateBalance', {
      requestedByUser: true
    })
  }

  watch(isOnline, async (newValue) => {
    if (newValue) {
      await updateBalance()
    }
  })

  watch(areCoinNodesOnline, async (newValue) => {
    if (newValue) {
      await updateBalance()
    }
  })

  onMounted(() => {
    visibilityId.value = Visibility.change(async (event, state) => {
      if (state === 'visible') {
        await updateBalance()
      }
    })
  })

  onUnmounted(() => {
    Visibility.unbind(Number(visibilityId.value))
  })

  return computed(() => balanceActualUntil.value > currentTime.value)
}
