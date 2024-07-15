import { useQuery } from '@tanstack/vue-query'
import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { KlyTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'
import { Cryptos } from '@/lib/constants'
import { klyIndexer } from '@/lib/nodes'

export function useKlyTransactionQuery(transactionId: MaybeRef<string>) {
  const store = useStore()

  return useQuery({
    queryKey: ['transaction', Cryptos.KLY, transactionId],
    queryFn: () => klyIndexer.getTransaction(unref(transactionId), store.state.kly.address),
    initialData: {} as KlyTransaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC)
  })
}
