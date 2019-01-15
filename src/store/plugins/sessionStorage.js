import VuexPersistence from 'vuex-persist'

const vuexPersistence = new VuexPersistence({
  key: 'adm',
  storage: window.sessionStorage,
  reducer: (state) => {
    return {
      // rootState
      address: state.address,
      balance: state.balance,
      passphrase: state.passphrase,
      publicKey: state.publicKey,
      privateKey: state.privateKey,

      // modules
      chat: state.chat,
      contacts: state.contacts
    }
  }
})

export default vuexPersistence.plugin
