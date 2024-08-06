import { ActionTree } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'
import { RootState } from '@/store/types'
import { mapWallets } from '@/store/modules/wallets/utils'

export const actions: ActionTree<WalletsState, RootState> = {
  initWalletsSymbols({ dispatch }): void {
    const walletSymbols: CoinSymbol[] = mapWallets()
    dispatch('setWalletSymbols', walletSymbols)
  },

  setWalletSymbols({ commit }, symbols: CoinSymbol[]): void {
    commit('setWalletSymbols', symbols)
  }
}
