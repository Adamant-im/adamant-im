import Vuetify from 'vuetify/lib'

const lightTheme = {
  primary: '#2E7EED',
  secondary: '#424242',
  accent: '#82B1FF',
  error: '#FF5252',
  info: '#2196F3',
  success: '#4CAF50',
  warning: '#FFC107'
}

export const vuetify = new Vuetify({
  theme: {
    themes: {
      light: lightTheme
    },

    options: {
      customProperties: true
    }
  },
  icons: {
    iconfont: 'mdi'
  }
})
