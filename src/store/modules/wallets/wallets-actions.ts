import { ActionTree } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'
import { RootState } from '@/store/types'
import { mapWallets } from '@/lib/mapWallets.ts'

export const actions: ActionTree<WalletsState, RootState> = {
  initWalletsSymbolsTemplates({ dispatch }): void {
    const walletSymbols: CoinSymbol[] = mapWallets()
    dispatch('setWalletSymbolsTemplates', walletSymbols)
  },

  setWalletSymbolsTemplates({ commit }, symbols: CoinSymbol[]): void {
    commit('setWalletSymbolsTemplates', symbols)
  }
}
