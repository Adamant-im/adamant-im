import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { Cryptos } from '@/lib/constants'
import { EthTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

export function useEthTransactionQuery(transactionId: MaybeRef<string>) {
  const store = useStore()

  return useQuery({
    queryKey: ['transaction', Cryptos.ETH, transactionId],
    queryFn: () => eth.getEthTransaction(unref(transactionId), store.state.eth.address),
    initialData: {} as EthTransaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC)
  })
}
