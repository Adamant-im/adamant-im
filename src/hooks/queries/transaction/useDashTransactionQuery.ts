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
    initialData: {} as DashTransaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC),
    refetchOnWindowFocus: false
  })
}
