import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { dogeIndexer } from '@/lib/nodes'
import { DogeTransaction } from '@/lib/nodes/types/transaction'
import { PendingTransaction, PendingTxStore } from '@/lib/pending-transactions'
import { refetchIntervalFactory, refetchOnMountFn, retryDelayFactory, retryFactory } from './utils'
import { UseTransactionQueryParams } from './types'

/**
 * @param transactionId - DOGE transaction ID
 * @param params - Hook params
 */
export function useDogeTransactionQuery(
  transactionId: MaybeRef<string>,
  params: UseTransactionQueryParams = {}
) {
  const store = useStore()

  return useQuery<DogeTransaction | PendingTransaction>({
    queryKey: ['transaction', Cryptos.DOGE, transactionId],
    queryFn: () => dogeIndexer.getTransaction(unref(transactionId), store.state.doge.address),
    initialData: () => {
      const pendingTransaction = PendingTxStore.get(Cryptos.DOGE)
      if (pendingTransaction?.id === unref(transactionId)) {
        return pendingTransaction
      }
    },
    retry: retryFactory(Cryptos.DOGE, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.DOGE, unref(transactionId)),
    refetchInterval: ({ state }) => refetchIntervalFactory(Cryptos.DOGE, state.status, state.data),
    refetchOnWindowFocus: false,
    refetchOnMount: params?.refetchOnMount ?? (({ state }) => refetchOnMountFn(state.data)),
    enabled: params.enabled
  })
}
