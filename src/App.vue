<template>
  <v-app
    :theme="themeName"
    class="application--linear-gradient"
    :style="{
      fontFamily: font
    }"
  >
    <warning-on-addresses-dialog v-model="showWarningOnAddressesDialog" />

    <component :is="layout">
      <router-view />
      <select class="position" v-model="font">
        <option value="'Exo 2', sans-serif">Exo 2</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Helvetica, sans-serif">Helvetica</option>
        <option value="Verdana, sans-serif">Verdana</option>
        <option value="Tahoma, sans-serif">Tahoma</option>
        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
        <option value="'Gill Sans', sans-serif">Gill Sans</option>
      </select>
    </component>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import dayjs from 'dayjs'
import WarningOnAddressesDialog from '@/components/WarningOnAddressesDialog.vue'
import Notifications from '@/lib/notifications'
import { ThemeName } from './plugins/vuetify'

export default defineComponent({
  components: {
    WarningOnAddressesDialog
  },
  data: () => ({
    showWarningOnAddressesDialog: false,
    notifications: null as Notifications | null,
    font: "'Exo 2', sans-serif"
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

<style lang="scss">
@import './assets/styles/themes/adamant/_mixins.scss';

.v-theme--light.application--linear-gradient {
  @include linear-gradient-light();
}
.v-theme--dark.application--linear-gradient {
  @include linear-gradient-dark();
}
.position {
  position: fixed;
  left: 32px;
  top: 16px;
  width: 80px;
  padding: 4px;
  background-color: map-get($adm-colors, 'good');
  text-align: center;
}
</style>
