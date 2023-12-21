import { AllCryptosOrder, CryptosInfo, CryptoSymbol } from '@/lib/constants/cryptos'
import { ActionTree } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'
import { RootState } from '@/store/types'

export const actions: ActionTree<WalletsState, RootState> = {
  initWalletsSymbolsTemplates({ dispatch }): void {
    const walletSymbols: CoinSymbol[] = AllCryptosOrder.map((crypto: CryptoSymbol) => {
      const isVisible: boolean = !!CryptosInfo[crypto].defaultVisibility
      const symbol: CryptoSymbol = CryptosInfo[crypto].symbol as CryptoSymbol

      return {
        isVisible,
        symbol
      } as CoinSymbol
    })
    dispatch('setWalletSymbolsTemplates', walletSymbols)
  },

  setWalletSymbolsTemplates({ commit }, symbols: CoinSymbol[]): void {
    commit('setWalletSymbolsTemplates', symbols)
  }
}
