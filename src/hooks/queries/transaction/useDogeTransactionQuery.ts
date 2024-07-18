import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { doge } from '@/lib/nodes'
import { DogeTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

/**
 * @param transactionId - DOGE transaction ID
 */
export function useDogeTransactionQuery(transactionId: MaybeRef<string>) {
  const store = useStore()

  return useQuery({
    queryKey: ['transaction', Cryptos.DOGE, transactionId],
    queryFn: () => doge.getTransaction(unref(transactionId), store.state.doge.address),
    initialData: {} as DogeTransaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC),
    refetchOnWindowFocus: false
  })
}
