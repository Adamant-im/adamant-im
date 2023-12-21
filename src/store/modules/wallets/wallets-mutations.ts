import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'

export default {
  setWalletSymbolsTemplates(state: WalletsState, value: CoinSymbol[]): void {
    state.symbols = value
  },

  updateVisibility(state: WalletsState, value: CoinSymbol): void {
    const symbol = state.symbols.find((item: CoinSymbol) => item.symbol === value.symbol)
    if (symbol) {
      symbol.isVisible = value.isVisible
    }
  }
}
