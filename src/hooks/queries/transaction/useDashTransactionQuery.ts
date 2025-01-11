import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { dash } from '@/lib/nodes'
import { DashTransaction } from '@/lib/nodes/types/transaction'
import { PendingTransaction, PendingTxStore } from '@/lib/pending-transactions'
import { refetchIntervalFactory, refetchOnMountFn, retryDelayFactory, retryFactory } from './utils'
import { UseTransactionQueryParams } from './types'

/**
 * @param transactionId - DASH transaction ID
 * @param params - Hook params
 */
export function useDashTransactionQuery(
  transactionId: MaybeRef<string>,
  params: UseTransactionQueryParams = {}
) {
  const store = useStore()

  return useQuery<DashTransaction | PendingTransaction>({
    queryKey: ['transaction', Cryptos.DASH, transactionId],
    queryFn: () => dash.getTransaction(unref(transactionId), store.state.dash.address),
    initialData: () => {
      const pendingTransaction = PendingTxStore.get(Cryptos.DASH)
      if (pendingTransaction?.id === unref(transactionId)) {
        return pendingTransaction
      }
    },
    retry: retryFactory(Cryptos.DASH, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.DASH, unref(transactionId)),
    refetchInterval: ({ state }) => refetchIntervalFactory(Cryptos.DASH, state.status, state.data),
    refetchOnWindowFocus: false,
    refetchOnMount: params?.refetchOnMount ?? (({ state }) => refetchOnMountFn(state.data)),
    enabled: params.enabled
  })
}
