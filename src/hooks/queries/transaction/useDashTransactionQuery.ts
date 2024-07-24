import { PendingTxStore } from '@/lib/pending-transactions'
import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { dash } from '@/lib/nodes'
import { DashTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

/**
 * @param transactionId - DASH transaction ID
 */
export function useDashTransactionQuery(transactionId: MaybeRef<string>) {
  const store = useStore()

  return useQuery({
    queryKey: ['transaction', Cryptos.DASH, transactionId],
    queryFn: () => dash.getTransaction(unref(transactionId), store.state.dash.address),
    initialData: () => {
      const pendingTransaction = PendingTxStore.get(Cryptos.DASH)
      if (pendingTransaction?.id === transactionId) return pendingTransaction

      return {} as DashTransaction
    },
    retry: retryFactory(Cryptos.DASH, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.DASH, unref(transactionId)),
    refetchInterval: ({ state }) =>
      refetchIntervalFactory(Cryptos.DASH, state.status, state.data?.status),
    refetchOnWindowFocus: false,
    refetchOnMount: false
  })
}
