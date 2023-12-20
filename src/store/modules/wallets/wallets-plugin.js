import VuexPersistence from 'vuex-persist'

const walletsPersistencePlugin = new VuexPersistence({
  key: 'adm-wallets',
  storage: window.localStorage,
  reducer: (state) => {
    return {
      symbols: state.wallets.symbols
    }
  }
})

export default walletsPersistencePlugin.plugin
