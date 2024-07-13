import { MaybeRef, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { CryptoSymbol } from '@/lib/constants'
import { Erc20Transaction } from '@/lib/nodes/types/transaction'

export function useErc20TransferQuery(transactionId: MaybeRef<string>, crypto: CryptoSymbol) {
  return useQuery({
    queryKey: ['transaction', crypto, transactionId],
    queryFn: () => eth.getErc20Transaction(unref(transactionId), crypto),
    initialData: {} as Erc20Transaction
  })
}
