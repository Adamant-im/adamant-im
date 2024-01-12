import VuexPersistence from 'vuex-persist'
import { RootState } from '@/store/types'

const walletsPersistencePlugin = new VuexPersistence({
  key: 'adm-wallets',
  storage: window.localStorage,
  reducer: (state: RootState) => {
    return {
      symbols: state.wallets.symbols
    }
  }
})

export default walletsPersistencePlugin.plugin
