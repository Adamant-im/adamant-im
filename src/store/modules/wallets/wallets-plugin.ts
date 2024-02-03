import VuexPersistence from 'vuex-persist'
import { RootState } from '@/store/types'
import { mapWallets } from '@/store/modules/wallets/utils.ts'
import { getFromLocalStorage } from '@/lib/localStorage'

function initWallets() {
  const predefinedWalletsTemplate: WalletsState = getFromLocalStorage('adm-wallets', {
    symbols: []
  })
  console.log('predefinedWallets', predefinedWalletsTemplate)

  if (!('symbols' in predefinedWalletsTemplate) || predefinedWalletsTemplate.symbols.length === 0) {
    localStorage.setItem(
      'adm-wallets',
      JSON.stringify({
        symbols: mapWallets()
      })
    )
    // dispatch('initWalletsSymbols')
  } else {
    const initialTemplate = mapWallets()

    const hasDifference = !!initialTemplate.filter(
      ({ symbol: symbol1 }) =>
        !predefinedWalletsTemplate.symbols.some(({ symbol: symbol2 }) => symbol2 === symbol1)
    ).length

    if (hasDifference) {
      console.log('has diff', mapWallets())
      localStorage.setItem(
        'adm-wallets',
        JSON.stringify({
          symbols: mapWallets()
        })
      )
    } else {
      // dispatch('setWalletSymbols', predefinedWalletsTemplate.symbols)
    }
  }
}
initWallets()

const walletsPersistencePlugin = new VuexPersistence({
  key: 'adm-wallets',
  storage: window.localStorage,
  restoreState: (key, storage) => {
    const wallets = JSON.parse(storage.getItem(key))
    console.log('restore state')
    return {
      wallets
    }
  },
  saveState: (key, state, storage) => {
    console.log('save state', state.wallets.symbols)
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
