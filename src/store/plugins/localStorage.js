import VuexPersistence from 'vuex-persist'

const vuexPersistence = new VuexPersistence({
  key: 'adm',
  storage: window.localStorage,
  reducer: (state) => {
    return {
      // modules
      language: state.language,
      options: {
        logoutOnTabClose: state.options.logoutOnTabClose,
        sendMessageOnEnter: state.options.sendMessageOnEnter,
        allowSoundNotifications: state.options.allowSoundNotifications,
        allowTabNotifications: state.options.allowTabNotifications,
        allowPushNotifications: state.options.allowPushNotifications,
        darkTheme: state.options.darkTheme,
        formatMessages: state.options.formatMessages,
        useSocketConnection: state.options.useSocketConnection
      }
    }
  }
})

export default vuexPersistence.plugin
