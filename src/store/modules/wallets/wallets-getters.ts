import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types.ts'
import { CryptoSymbol } from '@/lib/constants'

export default {
  getAllOrderedWalletSymbols: (state: WalletsState) => state.symbols,
  getVisibleOrderedWalletSymbols: (state: WalletsState) =>
    state.symbols.filter((walletSymbol: CoinSymbol) => walletSymbol.isVisible),
  getVisibility: (state: WalletsState) => (symbol: CryptoSymbol) =>
    state.symbols.find((item: CoinSymbol) => item.symbol === symbol)?.isVisible
}
