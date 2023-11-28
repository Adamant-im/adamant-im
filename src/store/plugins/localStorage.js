import VuexPersistence from 'vuex-persist'

const vuexPersistence = new VuexPersistence({
  key: 'adm',
  storage: window.localStorage,
  reducer: (state) => {
    return {
      // modules
      language: state.language,
      options: {
        stayLoggedIn: state.options.stayLoggedIn,
        sendMessageOnEnter: state.options.sendMessageOnEnter,
        allowSoundNotifications: state.options.allowSoundNotifications,
        allowTabNotifications: state.options.allowTabNotifications,
        allowPushNotifications: state.options.allowPushNotifications,
        darkTheme: state.options.darkTheme,
        formatMessages: state.options.formatMessages,
        useFullDate: state.options.useFullDate,
        useSocketConnection: state.options.useSocketConnection,
        suppressWarningOnAddressesNotification:
          state.options.suppressWarningOnAddressesNotification,
        currentRate: state.options.currentRate
      }
    }
  }
})

export default vuexPersistence.plugin
