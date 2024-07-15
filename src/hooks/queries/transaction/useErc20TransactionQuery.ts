import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { Cryptos, CryptoSymbol } from '@/lib/constants'
import { Erc20Transaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

export function useErc20TransactionQuery(crypto: CryptoSymbol) {
  return (transactionId: MaybeRef<string>) => {
    const store = useStore()

    return useQuery({
      queryKey: ['transaction', crypto, transactionId],
      queryFn: () => eth.getErc20Transaction(unref(transactionId), store.state.eth.address, crypto),
      initialData: {} as Erc20Transaction,
      retry: retryFactory(Cryptos.BTC, unref(transactionId)),
      retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
      refetchInterval: refetchIntervalFactory(Cryptos.BTC)
    })
  }
}
