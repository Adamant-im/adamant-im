import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'
import { CryptoSymbol } from '@/lib/constants'
import { GetterTree } from 'vuex'
import { RootState } from '@/store/types'

export const getters: GetterTree<WalletsState, RootState> = {
  getAllOrderedWalletSymbols: (state) => state.symbols,
  getVisibleSymbolsCount: (state) => state.symbols.filter((symbol) => symbol.isVisible).length,
  getVisibleOrderedWalletSymbols: (state) =>
    state.symbols.filter((walletSymbol: CoinSymbol) => walletSymbol.isVisible),
  getVisibility: (state) => (symbol: CryptoSymbol) => {
    return state.symbols.find((item: CoinSymbol) => item.symbol === symbol)?.isVisible
  }
}
