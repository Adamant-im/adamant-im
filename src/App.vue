<template>
  <v-app :theme="themeName" class="application--linear-gradient">
    <warning-on-addresses-dialog v-model="showWarningOnAddressesDialog" />
    <component :is="layout">
      <router-view />
    </component>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import dayjs from 'dayjs'
import WarningOnAddressesDialog from '@/components/WarningOnAddressesDialog.vue'
import Notifications from '@/lib/notifications'
import { ThemeName } from './plugins/vuetify'
import { Cryptos } from '@/lib/constants'

const loadVuexCoinModules = async () => {
  const ethModule = await import('@/store/modules/eth')
  const erc20Module = await import('@/store/modules/erc20')

  return {
    ethModule: ethModule.default,
    erc20Module: erc20Module.default
  }
}

export default defineComponent({
  components: {
    WarningOnAddressesDialog
  },
  data: () => ({
    showWarningOnAddressesDialog: false,
    notifications: null as Notifications | null
  }),
  computed: {
    layout() {
      return this.$route.meta.layout || 'default'
    },
    isLogged() {
      return this.$store.getters.isLogged
    },
    isLoginViaPassword() {
      return this.$store.getters['options/isLoginViaPassword']
    },
    themeName() {
      return this.$store.state.options.darkTheme ? ThemeName.Dark : ThemeName.Light
    }
  },
  created() {
    this.setLocale()
  },
  mounted() {
    this.notifications = new Notifications(this)
    this.notifications.start()

    loadVuexCoinModules().then(({ ethModule, erc20Module }) => {
      this.$store.registerModule('eth', ethModule)
      this.$store.registerModule(
        'bnb',
        erc20Module(Cryptos.BNB, '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 18)
      )
      this.$store.registerModule(
        'usds',
        erc20Module(Cryptos.USDS, '0xa4bdb11dc0a2bec88d24a3aa1e6bb17201112ebe', 6)
      )
    })
  },
  beforeUnmount() {
    this.notifications?.stop()
    this.$store.dispatch('stopInterval')
  },
  methods: {
    setLocale() {
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
})
</script>

<style lang="scss" scoped>
@import './assets/styles/themes/adamant/_mixins.scss';

.v-theme--light.application--linear-gradient {
  @include linear-gradient-light();
}
.v-theme--dark.application--linear-gradient {
  @include linear-gradient-dark();
}
</style>
