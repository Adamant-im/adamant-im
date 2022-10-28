<template>
  <v-app
    :dark="isDarkTheme"
    class="application--linear-gradient"
  >
    <warning-on-addresses-dialog v-model="showWarningOnAddressesDialog" />
    <component :is="layout">
      <router-view />
    </component>
  </v-app>
</template>

<script>
import { getPiniaStoresList, registerSaga } from '@/pinia/saga'
import { rootSaga } from '@/pinia/sagas/rootSaga'
import { getStores } from '@/pinia/stores'
import { useSnackbarStore } from '@/pinia/stores/snackbar/snackbar'
import dayjs from 'dayjs'
import WarningOnAddressesDialog from '@/components/WarningOnAddressesDialog'
import Notifications from '@/lib/notifications'

export default {
  components: {
    WarningOnAddressesDialog
  },
  data: () => ({
    showWarningOnAddressesDialog: false
  }),
  computed: {
    layout () {
      return this.$route.meta.layout || 'default'
    },
    isLogged () {
      return this.$store.getters.isLogged
    },
    isDarkTheme () {
      return this.$store.state.options.darkTheme
    },
    isLoginViaPassword () {
      return this.$store.getters['options/isLoginViaPassword']
    }
  },
  created () {
    this.setLocale()
  },
  mounted () {
    this.notifications = new Notifications(this)
    this.notifications.start()

    registerSaga(rootSaga, getStores())

    console.log('useSnackbarStore', useSnackbarStore())
    console.log('getPiniasStoresList', getPiniaStoresList(this.$pinia))
    console.log('this.$pinia', this.$pinia)
  },
  beforeDestroy () {
    this.notifications.stop()
    this.$store.dispatch('stopInterval')
  },
  beforeMount () {
    this.$vuetify.theme.dark = this.$store.state.options.darkTheme // sync Vuetify theme with the store
  },
  methods: {
    setLocale () {
      // Set language from `localStorage`.
      //
      // This is required only when initializing the application.
      // Subsequent mutations of `language.currentLocale`
      // will be synchronized with `i18n.locale`.
      const localeFromStorage = this.$store.state.language.currentLocale
      this.$i18n.locale = localeFromStorage
      dayjs.locale(localeFromStorage)
    }
  }
}
</script>

<style lang="scss" scoped>
@import './assets/styles/themes/adamant/_mixins.scss';

.theme--light.application--linear-gradient {
  @include linear-gradient-light();
}
.theme--dark.application--linear-gradient {
  @include linear-gradient-dark();
}
</style>
