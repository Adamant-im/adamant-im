import { MaybeRef, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { Cryptos, CryptoSymbol } from '@/lib/constants'
import { Erc20Transaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

export function useErc20TransactionQuery(transactionId: MaybeRef<string>, crypto: CryptoSymbol) {
  return useQuery({
    queryKey: ['transaction', crypto, transactionId],
    queryFn: () => eth.getErc20Transaction(unref(transactionId), crypto),
    initialData: {} as Erc20Transaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC)
  })
}
