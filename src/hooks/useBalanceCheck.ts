import { useStore } from 'vuex'
import { useNow } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Visibility from 'visibilityjs'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { CoinSymbol } from '@/store/modules/wallets/types'

export function useBalanceCheck() {
  const store = useStore()
  const { now } = useNow({ interval: 500, controls: true })

  const visibilityId = ref<number | boolean | null>(null)

  const chosenCoins = computed<CoinSymbol[]>(
    () => store.getters['wallets/getVisibleOrderedWalletSymbols']
  )
  const isOnline = computed(() => store.getters['isOnline'])
  const coinNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/coins'])
  const areCoinNodesOnline = computed(() =>
    coinNodes.value.some((node) => node.status === 'online')
  )
  const currentTime = computed(() => now.value.getTime())
  const coinsBalanceActual = computed(() =>
    chosenCoins.value.map((coin) => {
      const crypto = coin.symbol.toLowerCase()
      if (crypto === 'adm') {
        return store.state.balanceActualUntil > currentTime.value
      }
      return store.state[crypto].balanceActualUntil > currentTime.value
    })
  )

  const updateBalance = async () => {
    await store.dispatch('requestBalanceUpdate')
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

  return computed(() => coinsBalanceActual.value)
}
