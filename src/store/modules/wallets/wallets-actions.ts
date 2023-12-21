import { AllCryptosOrder, CryptosInfo } from '@/lib/constants/cryptos'
import { Commit, Dispatch } from 'vuex'

export default {
  initWalletsSymbolsTemplates({ dispatch }: { dispatch: Dispatch }): void {
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

  setWalletSymbolsTemplates({ commit }: { commit: Commit }, symbols): void {
    commit('setWalletSymbolsTemplates', symbols)
  }
}
