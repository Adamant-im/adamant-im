import VuexPersistence from 'vuex-persist'

const vuexPersistence = new VuexPersistence({
  key: 'botCommands',
  storage: window.sessionStorage,
  modules: ['botCommands']
})

export default vuexPersistence.plugin
