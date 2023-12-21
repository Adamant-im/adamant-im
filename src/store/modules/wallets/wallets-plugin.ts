import VuexPersistence from 'vuex-persist'
import { CoinSymbol, PluginWalletsState } from '@/store/modules/wallets/types'

const walletsPersistencePlugin = new VuexPersistence({
  key: 'adm-wallets',
  storage: window.localStorage,
  reducer: (state: PluginWalletsState) => {
    return {
      symbols: state.wallets.symbols as CoinSymbol[]
    }
  }
})

export default walletsPersistencePlugin.plugin
