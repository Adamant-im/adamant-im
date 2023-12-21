import { AllCryptosOrder, CryptosInfo, CryptoSymbol } from '@/lib/constants/cryptos'
import { Commit, Dispatch } from 'vuex'
import { CoinSymbol } from '@/store/modules/wallets/types.ts'

export default {
  initWalletsSymbolsTemplates({ dispatch }: { dispatch: Dispatch }): void {
    const walletSymbols: CoinSymbol[] = AllCryptosOrder.map((crypto: CryptoSymbol) => {
      const isVisible = !!CryptosInfo[crypto].defaultVisibility
      const symbol: CryptoSymbol = CryptosInfo[crypto].symbol as CryptoSymbol

      return {
        isVisible,
        symbol
      } as CoinSymbol
    })
    dispatch('setWalletSymbolsTemplates', walletSymbols)
  },

  setWalletSymbolsTemplates({ commit }: { commit: Commit }, symbols: CoinSymbol[]): void {
    commit('setWalletSymbolsTemplates', symbols)
  }
}
