import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

const lightTheme = {
  primary: '#2E7EED',
  secondary: '#424242',
  accent: '#82B1FF',
  error: '#FF5252',
  info: '#2196F3',
  success: '#4CAF50',
  warning: '#FFC107'
}

export const vuetify = createVuetify({
  components,
  directives,
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
