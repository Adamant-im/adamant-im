import * as ethUtils from '@/lib/eth-utils'
import { useQuery } from '@tanstack/vue-query'
import { MaybeRef, unref } from 'vue'

import { CryptosInfo, CryptoSymbol } from '@/lib/constants'
import { eth } from '@/lib/nodes'
import { AbiDecoder } from '@/lib/abi/abi-decoder'
import Erc20 from '@/store/modules/erc20/erc20.abi.json'

const abiDecoder = new AbiDecoder(Erc20 as any) // @todo type

// @todo type
const parseTransaction = (tx: any, crypto: CryptoSymbol) => {
  let recipientId = null
  let amount = null

  const decoded = abiDecoder.decodeMethod(tx.input)
  if (decoded && decoded.name === 'transfer') {
    decoded.params.forEach((x) => {
      if (x.name === '_to') recipientId = x.value
      if (x.name === '_value') amount = ethUtils.toFraction(x.value, CryptosInfo[crypto].decimals)
    })
  }

  if (recipientId) {
    return {
      // Why comparing to eth.actions, there is no fee and status?
      hash: tx.hash,
      senderId: tx.from,
      blockNumber: Number(tx.blockNumber),
      amount,
      recipientId,
      gasPrice: Number(tx.gasPrice || tx.effectiveGasPrice)
    }
  }

  return null
}

async function fetchTransaction(transactionId: string, crypto: CryptoSymbol) {
  const transaction = await eth.useClient((client) => client.getTransaction(unref(transactionId)))

  return parseTransaction(transaction, crypto)
}

export function useErc20TransferQuery(transactionId: MaybeRef<string>, crypto: CryptoSymbol) {
  return useQuery({
    queryKey: ['transaction', crypto, transactionId],
    queryFn: () => fetchTransaction(unref(transactionId), crypto),
    initialData: {} as unknown as Record<string, any>
  })
}
