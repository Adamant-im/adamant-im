import VuexPersistence from 'vuex-persist'
import { normalizeWalletsState } from '@/store/modules/wallets/utils'
import { WalletsState } from '@/store/modules/wallets/types'
import { TypedStorage } from '@/lib/typed-storage'

const WALLETS_STATE_STORAGE_KEY = 'WALLETS_STATE_STORAGE'

const stateStorage = new TypedStorage<typeof WALLETS_STATE_STORAGE_KEY, WalletsState | null>(
  WALLETS_STATE_STORAGE_KEY,
  null,
  window.localStorage
)
function initWallets() {
  const state = stateStorage.getItem()
  const normalizedState = normalizeWalletsState(state)

  if (JSON.stringify(state) !== JSON.stringify(normalizedState)) {
    stateStorage.setItem(normalizedState)
  }
}
initWallets()

const walletsPersistencePlugin = new VuexPersistence({
  key: WALLETS_STATE_STORAGE_KEY,
  restoreState: (key, storage) => {
    let wallets = {}
    if (storage) {
      const stateFromLS = normalizeWalletsState(stateStorage.getItem())

      if (stateFromLS.symbols.length) {
        wallets = stateFromLS
      }
    }

    return {
      wallets
    }
  },
  saveState: (key, state: Record<string, WalletsState>, storage) => {
    storage!.setItem(
      key,
      JSON.stringify({
        symbols: state.wallets.symbols
      })
    )
  },
  filter: (mutation) => {
    return (
      mutation.type === 'wallets/updateVisibility' || mutation.type === 'wallets/setWalletSymbols'
    )
  }
})

export default walletsPersistencePlugin.plugin
