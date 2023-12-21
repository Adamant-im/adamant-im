import { Store } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'

export default {
  setWalletSymbolsTemplates(state: Store<WalletsState>, value: CoinSymbol[]): void {
    state.symbols = value
  },

  updateVisibility(state: Store<WalletsState>, value: CoinSymbol): void {
    const symbol = state.symbols.find((item) => item.symbol === value.symbol)
    if (symbol) {
      symbol.isVisible = value.isVisible
    }
  }
}
