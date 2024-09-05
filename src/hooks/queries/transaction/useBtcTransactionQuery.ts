import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { btcIndexer } from '@/lib/nodes'
import { BtcTransaction } from '@/lib/nodes/types/transaction'
import { PendingTransaction, PendingTxStore } from '@/lib/pending-transactions'
import { refetchIntervalFactory, refetchOnMountFn, retryDelayFactory, retryFactory } from './utils'
import { UseTransactionQueryParams } from './types'

/**
 * @param transactionId - BTC transaction ID
 * @param params - Hook params
 */
export function useBtcTransactionQuery(
  transactionId: MaybeRef<string>,
  params: UseTransactionQueryParams = {}
) {
  const store = useStore()

  return useQuery<BtcTransaction | PendingTransaction>({
    queryKey: ['transaction', Cryptos.BTC, transactionId],
    queryFn: () => btcIndexer.getTransaction(unref(transactionId), store.state.btc.address),
    initialData: () => {
      const pendingTransaction = PendingTxStore.get(Cryptos.BTC)
      if (pendingTransaction?.id === unref(transactionId)) {
        return pendingTransaction
      }
    },
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: ({ state }) => refetchIntervalFactory(Cryptos.BTC, state.status, state.data),
    refetchOnWindowFocus: false,
    refetchOnMount: params?.refetchOnMount ?? (({ state }) => refetchOnMountFn(state.data)),
    enabled: params.enabled
  })
}
