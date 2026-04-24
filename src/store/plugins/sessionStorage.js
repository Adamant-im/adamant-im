import VuexPersistence from 'vuex-persist'

const vuexPersistence = new VuexPersistence({
  key: 'adm',
  storage: window.sessionStorage,
  reducer: (state) => {
    return {
      // rootState
      // passphrase and password are intentionally excluded:
      // storing the BIP39 passphrase (even Base64-encoded) in sessionStorage
      // exposes it to any XSS payload or malicious browser extension
      address: state.address,
      balance: state.balance
    }
  }
})

export default vuexPersistence.plugin
