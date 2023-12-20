export default {
  getAllOrderedWalletSymbols: (state) => state.symbols,
  getVisibleOrderedWalletSymbols: (state) =>
    state.symbols.filter((walletSymbol) => walletSymbol.isVisible),
  getVisibility: (state) => (symbol) =>
    state.symbols.find((item) => item.symbol === symbol).isVisible
}
