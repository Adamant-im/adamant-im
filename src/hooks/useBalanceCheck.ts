import { useStore } from 'vuex'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

export function useBalanceCheck() {
  const store = useStore()
  const { now } = useNow({ interval: 500, controls: true })

  const balanceActualUntil = computed(() => store.state.balanceActualUntil)
  const currentTime = computed(() => now.value.getTime())

  return computed(() => balanceActualUntil.value > currentTime.value)
}
