import { CryptosInfo, isErc20 } from '@/lib/constants'
import erc20Module from '@/store/modules/erc20'
import ethModule from '@/store/modules/eth'
import { AllCryptosOrder } from '@/lib/constants/cryptos'

export function registerCryptoModules(store) {
  store.registerModule('eth', ethModule)

  AllCryptosOrder.forEach((symbol) => {
    const crypto = CryptosInfo[symbol]

    if (isErc20(symbol)) {
      store.registerModule(
        symbol.toLowerCase(),
        erc20Module(symbol, crypto.contractId, crypto.decimals)
      )
    }
  })
}
