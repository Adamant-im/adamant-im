import { AllCryptosOrder, CryptosInfo } from '../../../lib/constants/cryptos'

export default {
  initWalletsSymbolsTemplates({ dispatch }) {
    const walletSymbols = AllCryptosOrder.map((crypto) => {
      const isVisible = !!CryptosInfo[crypto].defaultVisibility
      const symbol = CryptosInfo[crypto].symbol

      return {
        isVisible,
        symbol
      }
    })
    dispatch('setWalletSymbolsTemplates', walletSymbols)
  },

  setWalletSymbolsTemplates({ commit }, symbols) {
    commit('setWalletSymbolsTemplates', symbols)
  }
}
