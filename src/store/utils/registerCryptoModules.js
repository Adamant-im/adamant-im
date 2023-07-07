import { CryptosInfo, CryptosOrder, isErc20 } from '@/lib/constants'
import erc20Module from '@/store/modules/erc20'
import ethModule from '@/store/modules/eth'

export function registerCryptoModules(store) {
  store.registerModule('eth', ethModule)

  CryptosOrder.forEach((symbol) => {
    const crypto = CryptosInfo[symbol]

    if (isErc20(symbol)) {
      store.registerModule(
        symbol.toLowerCase(),
        erc20Module(symbol, crypto.contractId, crypto.decimals)
      )
    }
  })
}
