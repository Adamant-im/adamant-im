import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { KlyTransaction } from '@/lib/nodes/types/transaction'
import { PendingTransaction, PendingTxStore } from '@/lib/pending-transactions'
import { refetchIntervalFactory, refetchOnMountFn, retryDelayFactory, retryFactory } from './utils'
import { Cryptos } from '@/lib/constants'
import { klyIndexer } from '@/lib/nodes'
import { UseTransactionQueryParams } from './types'

export function useKlyTransactionQuery(
  transactionId: MaybeRef<string>,
  params: UseTransactionQueryParams = {}
) {
  const store = useStore()

  return useQuery<KlyTransaction | PendingTransaction>({
    queryKey: ['transaction', Cryptos.KLY, transactionId],
    queryFn: () => klyIndexer.getTransaction(unref(transactionId), store.state.kly.address),
    initialData: () => {
      const pendingTransaction = PendingTxStore.get(Cryptos.KLY)
      if (pendingTransaction?.id === unref(transactionId)) {
        return pendingTransaction
      }
    },
    retry: retryFactory(Cryptos.KLY, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.KLY, unref(transactionId)),
    refetchInterval: ({ state }) => refetchIntervalFactory(Cryptos.KLY, state.status, state.data),
    refetchOnWindowFocus: false,
    refetchOnMount: params?.refetchOnMount ?? (({ state }) => refetchOnMountFn(state.data)),
    enabled: params.enabled
  })
}
