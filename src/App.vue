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
import { getFromLocalStorage } from '@/lib/localStorage.ts'
import { WalletsState } from '@/store/modules/wallets/types.ts'
import { mapWallets } from '@/lib/mapWallets.ts'

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

    const predefinedWalletsTemplate: WalletsState = getFromLocalStorage('adm-wallets', {
      symbols: []
    })
    if (
      !('symbols' in predefinedWalletsTemplate) ||
      predefinedWalletsTemplate.symbols.length === 0
    ) {
      this.$store.dispatch('wallets/initWalletsSymbolsTemplates', null)
    } else {
      const initialTemplate = mapWallets()

      const hasDifference = !!initialTemplate.filter(
        ({ symbol: symbol1 }) =>
          !predefinedWalletsTemplate.symbols.some(({ symbol: symbol2 }) => symbol2 === symbol1)
      ).length

      if (hasDifference) {
        this.$store.dispatch('wallets/initWalletsSymbolsTemplates', null)
      } else {
        this.$store.dispatch('wallets/setWalletSymbolsTemplates', predefinedWalletsTemplate.symbols)
      }
    }
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
@import '@/assets/styles/themes/adamant/_mixins.scss';

.v-theme--light.application--linear-gradient {
  @include linear-gradient-light();
}
.v-theme--dark.application--linear-gradient {
  @include linear-gradient-dark();
}
</style>
