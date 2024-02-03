import { ActionTree } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'
import { RootState } from '@/store/types'
import { mapWallets } from '@/store/modules/wallets/utils'
import { getFromLocalStorage } from '@/lib/localStorage'

export const actions: ActionTree<WalletsState, RootState> = {
  checkWalletsOrderBeforeInit({ dispatch }): void {
    const predefinedWalletsTemplate: WalletsState = getFromLocalStorage('adm-wallets', {
      symbols: []
    })
    if (
      !('symbols' in predefinedWalletsTemplate) ||
      predefinedWalletsTemplate.symbols.length === 0
    ) {
      dispatch('initWalletsSymbols')
    } else {
      const initialTemplate = mapWallets()

      const hasDifference = !!initialTemplate.filter(
        ({ symbol: symbol1 }) =>
          !predefinedWalletsTemplate.symbols.some(({ symbol: symbol2 }) => symbol2 === symbol1)
      ).length

      if (hasDifference) {
        dispatch('initWalletsSymbols')
      } else {
        dispatch('setWalletSymbols', predefinedWalletsTemplate.symbols)
      }
    }
  },

  initWalletsSymbols({ dispatch }): void {
    console.log('initWalletsSymbols')
    const walletSymbols: CoinSymbol[] = mapWallets()
    dispatch('setWalletSymbols', walletSymbols)
  },

  setWalletSymbols({ commit }, symbols: CoinSymbol[]): void {
    console.log('setWalletsSymbols')
    commit('setWalletSymbols', symbols)
  }
}
