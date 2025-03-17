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
// import { getMyPK } from '@/lib/adamant-api'

import { fcm } from './firebase'
import { onMessage, getToken } from 'firebase/messaging'
const _vapidKey =
  'BOUaH-qBAFhcEzR3sETwqJDDP-WjWShYr3NAXFQwHTXT0ZIQirLuTTgL7U20kAzsFD5FE4nvTWbF1iSiAMGnyiY'

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
    },
    myPK() {
      return this.$store.getters.getMyPK
    }
  },
  watch: {
    myPK(newVal, oldVal) {
      if (newVal && !oldVal) {
        const channel = new BroadcastChannel('adm_notifications')
        channel.postMessage({ isCheckPK: true })
        channel.onmessage = async (event) => {
          const data = event.data
          if (data && data.isNoPrivateKey) {
            const privateKey = newVal
            if (privateKey) channel.postMessage({ privateKey })
          }
        }
      }
    }
  },
  async created() {
    this.setLocale()
    // const isPushNotifications = this.$store.state.options.allowNotificationType === '2'
    // console.log("🚀 ~ App.vue:66 ~ created ~ isPushNotifications:", isPushNotifications)
    // if (isPushNotifications)
    await this.registerCustomWorker()
  },
  mounted() {
    this.notifications = new Notifications(this)
    this.notifications.start()
    console.log('🚀 ~ mounted ~ fcm:', fcm)
    onMessage(fcm, (payload: object) => {
      console.log('!! Message received. ', payload)
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
    },
    async registerCustomWorker() {
      try {
        const worker = await navigator.serviceWorker.register(
          import.meta.env.MODE === 'production' ? '/firebase-messagin-sw.js' : '/dev-sw.js?dev-sw',
          {
            type: import.meta.env.MODE === 'production' ? 'classic' : 'module'
          }
        )
        const token = await getToken(fcm, {
          vapidKey: _vapidKey,
          serviceWorkerRegistration: worker
        })
        console.log('🚀 107 ~ registerCustomWorker ~ token:', token)
      } catch (error) {
        console.log('🚀 125 ~ registerCustomWorker ~ error:', error)
      }
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
