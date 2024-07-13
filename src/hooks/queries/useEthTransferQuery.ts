import { MaybeRef, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { EthTransaction } from '@/lib/nodes/types/transaction'

export function useEthTransferQuery(transactionId: MaybeRef<string>) {
  return useQuery({
    queryKey: ['transaction', crypto, transactionId],
    queryFn: () => eth.getEthTransaction(unref(transactionId)),
    initialData: {} as EthTransaction
  })
}
