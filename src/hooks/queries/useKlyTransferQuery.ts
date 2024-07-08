import { useQuery } from '@tanstack/vue-query'
import { computed, MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'

import { Cryptos } from '@/lib/constants'
import { klyIndexer } from '@/lib/nodes'

export function useKlyTransferQuery(transactionId: MaybeRef<string>) {
  const store = useStore()
  const klyAddress = computed(() => store.state.kly.address)

  return useQuery({
    queryKey: ['transaction', Cryptos.KLY, transactionId],
    queryFn: () => klyIndexer.getTransaction(unref(transactionId), unref(klyAddress)),
    initialData: {} as Awaited<ReturnType<typeof klyIndexer.getTransaction>>
  })
}
