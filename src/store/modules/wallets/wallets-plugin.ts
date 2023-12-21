import VuexPersistence from 'vuex-persist'
import { Store } from 'vuex'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'

const walletsPersistencePlugin = new VuexPersistence({
  key: 'adm-wallets',
  storage: window.localStorage,
  reducer: (state: Store<WalletsState>) => {
    return {
      symbols: state.wallets.symbols as CoinSymbol[]
    }
  }
})

export default walletsPersistencePlugin.plugin
