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
      password: state.password
    }
  }
})

export default vuexPersistence.plugin
