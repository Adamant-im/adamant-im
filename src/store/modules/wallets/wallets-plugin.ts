import VuexPersistence from 'vuex-persist'
import { mapWallets } from '@/store/modules/wallets/utils'
import { getFromLocalStorage } from '@/lib/localStorage'
import { WalletsState } from '@/store/modules/wallets/types'

function initWallets() {
  const predefinedWalletsTemplate: WalletsState = getFromLocalStorage('adm-wallets', {
    symbols: []
  })

  if (!('symbols' in predefinedWalletsTemplate) || predefinedWalletsTemplate.symbols.length === 0) {
    localStorage.setItem(
      'adm-wallets',
      JSON.stringify({
        symbols: mapWallets()
      })
    )
  } else {
    const initialTemplate = mapWallets()

    const hasDifference = !!initialTemplate.filter(
      ({ symbol: symbol1 }) =>
        !predefinedWalletsTemplate.symbols.some(({ symbol: symbol2 }) => symbol2 === symbol1)
    ).length

    if (hasDifference) {
      localStorage.setItem(
        'adm-wallets',
        JSON.stringify({
          symbols: mapWallets()
        })
      )
    }
  }
}
initWallets()

const walletsPersistencePlugin = new VuexPersistence({
  key: 'adm-wallets',
  storage: window.localStorage,
  restoreState: (key, storage) => {
    let wallets = {}
    if (storage) {
      const item = storage.getItem(key)
      if (item) {
        wallets = JSON.parse(item)
      }
    }

    return {
      wallets
    }
  },
  saveState: (key, state: Record<string, WalletsState>, storage) => {
    if (!storage) throw new Error('Storage is undefined in wallets plugin')

    storage.setItem(
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
