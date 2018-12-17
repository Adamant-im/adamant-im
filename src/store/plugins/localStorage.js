import VuexPersistence from 'vuex-persist'

const vuexPersistence = new VuexPersistence({
  key: 'adm',
  storage: window.localStorage,
  reducer: (state) => {
    return {
      // modules
      language: state.language,
      options: state.options
    }
  }
})

export default vuexPersistence.plugin
