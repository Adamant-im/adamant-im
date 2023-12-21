import { Store } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types.ts'

export default {
  getAllOrderedWalletSymbols: (state: Store<WalletsState>) => state.symbols,
  getVisibleOrderedWalletSymbols: (state: Store<WalletsState>) =>
    state.symbols.filter((walletSymbol: CoinSymbol) => walletSymbol.isVisible),
  getVisibility: (state: Store<WalletsState>) => (symbol: CoinSymbol) =>
    state.symbols.find((item: CoinSymbol) => item.symbol === symbol).isVisible
}
