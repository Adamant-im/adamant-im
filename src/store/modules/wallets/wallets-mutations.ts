import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'
import { MutationTree } from 'vuex'

export const mutations: MutationTree<WalletsState> = {
  setWalletSymbols(state, value: CoinSymbol[]): void {
    state.symbols = value
  },

  updateVisibility(state, value: CoinSymbol): void {
    const symbol = state.symbols.find((item: CoinSymbol) => item.symbol === value.symbol)
    if (symbol) {
      symbol.isVisible = value.isVisible
    }
  }
}
