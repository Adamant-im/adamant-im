import { PendingTxStore } from '@/lib/pending-transactions'
import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { Cryptos } from '@/lib/constants'
import { EthTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, refetchOnMountFn, retryDelayFactory, retryFactory } from './utils'

export function useEthTransactionQuery(transactionId: MaybeRef<string>) {
  const store = useStore()

  return useQuery({
    queryKey: ['transaction', Cryptos.ETH, transactionId],
    queryFn: () => eth.getEthTransaction(unref(transactionId), store.state.eth.address),
    initialData: () => {
      const pendingTransaction = PendingTxStore.get(Cryptos.ETH)
      if (pendingTransaction?.id === transactionId) return pendingTransaction

      return {} as EthTransaction
    },
    retry: retryFactory(Cryptos.ETH, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.ETH, unref(transactionId)),
    refetchInterval: ({ state }) => refetchIntervalFactory(Cryptos.ETH, state.status, state.data),
    refetchOnWindowFocus: false,
    refetchOnMount: ({ state }) => refetchOnMountFn(state.data)
  })
}
