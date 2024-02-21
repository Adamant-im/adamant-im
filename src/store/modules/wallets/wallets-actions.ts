import { ActionTree } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'
import { RootState } from '@/store/types'
import { mapWallets } from '@/store/modules/wallets/utils'
import { TypedStorage } from '@/lib/typed-storage'
// import { getFromLocalStorage } from '@/lib/localStorage'

const WALLETS_STATE_STORAGE_KEY = 'WALLETS_STATE_STORAGE'

const stateStorage = new TypedStorage(
  WALLETS_STATE_STORAGE_KEY,
  {} as WalletsState,
  window.localStorage
)
export const actions: ActionTree<WalletsState, RootState> = {
  checkWalletsOrderBeforeInit({ dispatch }): void {
    let state = stateStorage.getItem()

    if (!state) {
      state = { symbols: mapWallets() }
      stateStorage.setItem(state)
    } else {
      const initialTemplate = mapWallets()

      const hasDifference = !!initialTemplate.filter(
        ({ symbol: symbol1 }) => !state!.symbols.some(({ symbol: symbol2 }) => symbol2 === symbol1)
      ).length

      if (hasDifference) {
        dispatch('initWalletsSymbols')
      } else {
        dispatch('setWalletSymbols', state.symbols)
      }
    }
  },

  initWalletsSymbols({ dispatch }): void {
    dispatch('checkWalletsOrderBeforeInit')
    const walletSymbols: CoinSymbol[] = mapWallets()
    dispatch('setWalletSymbols', walletSymbols)
  },

  setWalletSymbols({ commit }, symbols: CoinSymbol[]): void {
    commit('setWalletSymbols', symbols)
  }
}
