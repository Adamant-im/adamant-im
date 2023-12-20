export default {
  setWalletSymbolsTemplates(state, value) {
    state.symbols = value
  },

  updateVisibility(state, value) {
    const symbol = state.symbols.find((item) => item.symbol === value.symbol)
    if (symbol) {
      symbol.isVisible = value.value
    }
  }
}
