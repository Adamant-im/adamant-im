import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

/**
 * @type { import('vuetify').ThemeDefinition }
 */
const lightTheme = {
  dark: false,
  colors: {
    primary: '#2E7EED',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107'
  }
}

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',

    themes: {
      light: lightTheme
    },

    options: {
      customProperties: true
    }
  }
})
