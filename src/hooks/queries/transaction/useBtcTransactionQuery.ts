import { PendingTxStore } from '@/lib/pending-transactions'
import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { btc } from '@/lib/nodes'
import { BtcTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

/**
 * @param transactionId - BTC transaction ID
 */
export function useBtcTransactionQuery(transactionId: MaybeRef<string>) {
  const store = useStore()

  return useQuery({
    queryKey: ['transaction', Cryptos.BTC, unref(transactionId)],
    queryFn: () => btc.getTransaction(unref(transactionId), store.state.btc.address),
    initialData: () => {
      const pendingTransaction = PendingTxStore.get(Cryptos.BTC)
      if (pendingTransaction?.id === transactionId) return pendingTransaction

      return {} as BtcTransaction
    },
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC),
    refetchOnWindowFocus: false
  })
}
