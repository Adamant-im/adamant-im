<template>
  <v-app :theme="themeName" class="application--linear-gradient">
    <UploadAttachmentExitPrompt />
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
import UploadAttachmentExitPrompt from '@/components/UploadAttachmentExitPrompt.vue'
import Notifications from '@/lib/notifications'
import { ThemeName } from './plugins/vuetify'

import { fcm } from './firebase'
import { getToken } from 'firebase/messaging'
import { VAPID_KEY, notificationType } from '@/lib/constants'

export default defineComponent({
  components: {
    WarningOnAddressesDialog,
    UploadAttachmentExitPrompt
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
    isNotificationsAllowed() {
      return this.$store.state.options.isAllowNotifications
    },
    isBackgroundFetchNotification() {
      return (
        this.isNotificationsAllowed &&
        this.$store.state.options.allowNotificationType === notificationType['Background Fetch']
      )
    },
    isPushNotification() {
      return (
        this.isNotificationsAllowed &&
        this.$store.state.options.allowNotificationType === notificationType['Push']
      )
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
    if (this.isPushNotification) await this.registerCustomWorker()
  },
  mounted() {
    if (this.isBackgroundFetchNotification) {
      this.notifications = new Notifications(this)
      this.notifications.start()
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
          vapidKey: VAPID_KEY,
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
@use '@/assets/styles/themes/adamant/_mixins.scss';

.v-theme--light.application--linear-gradient {
  @include mixins.linear-gradient-light();
}
.v-theme--dark.application--linear-gradient {
  @include mixins.linear-gradient-dark();
}
</style>
