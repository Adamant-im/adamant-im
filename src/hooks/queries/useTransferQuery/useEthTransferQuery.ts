import { Cryptos } from '@/lib/constants'
import { MaybeRef, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { EthTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

export function useEthTransferQuery(transactionId: MaybeRef<string>) {
  return useQuery({
    queryKey: ['transaction', crypto, transactionId],
    queryFn: () => eth.getEthTransaction(unref(transactionId)),
    initialData: {} as EthTransaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC)
  })
}
