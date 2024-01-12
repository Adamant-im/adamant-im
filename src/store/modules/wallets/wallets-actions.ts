import { ActionTree } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'
import { RootState } from '@/store/types'
import { mapWallets } from '@/lib/mapWallets'
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
      dispatch('initWalletsSymbolsTemplates')
    } else {
      const initialTemplate = mapWallets()

      const hasDifference = !!initialTemplate.filter(
        ({ symbol: symbol1 }) =>
          !predefinedWalletsTemplate.symbols.some(({ symbol: symbol2 }) => symbol2 === symbol1)
      ).length

      if (hasDifference) {
        dispatch('initWalletsSymbolsTemplates')
      } else {
        dispatch('setWalletSymbolsTemplates', predefinedWalletsTemplate.symbols)
      }
    }
  },

  initWalletsSymbolsTemplates({ dispatch }): void {
    const walletSymbols: CoinSymbol[] = mapWallets()
    dispatch('setWalletSymbolsTemplates', walletSymbols)
  },

  setWalletSymbolsTemplates({ commit }, symbols: CoinSymbol[]): void {
    commit('setWalletSymbolsTemplates', symbols)
  }
}
