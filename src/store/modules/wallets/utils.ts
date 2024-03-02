import { AllCryptosOrder, CryptosInfo, CryptoSymbol } from '@/lib/constants/cryptos'
import { CoinSymbol } from '@/store/modules/wallets/types'

export function mapWallets(): CoinSymbol[] {
  return AllCryptosOrder.map((crypto: CryptoSymbol) => {
    const isVisible = !!CryptosInfo[crypto].defaultVisibility
    const symbol = CryptosInfo[crypto].symbol as CryptoSymbol

    return {
      isVisible,
      symbol
    }
  })
}
