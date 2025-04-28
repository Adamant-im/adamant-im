<template>
  <v-app :theme="themeName" class="application--linear-gradient">
    <UploadAttachmentExitPrompt />
    <warning-on-addresses-dialog v-model="showWarningOnAddressesDialog" />

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, watch, onBeforeUnmount, onMounted, getCurrentInstance, ref } from 'vue'
import dayjs from 'dayjs'
import WarningOnAddressesDialog from '@/components/WarningOnAddressesDialog.vue'
import UploadAttachmentExitPrompt from '@/components/UploadAttachmentExitPrompt.vue'
import Notifications from '@/lib/notifications'
import { ThemeName } from './plugins/vuetify'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

import { fcm } from './firebase'
import { getToken } from 'firebase/messaging'
import { VAPID_KEY, notificationType } from '@/lib/constants'

const store = useStore()
const isSnackbarShowing = computed(() => store.state.snackbar.show)

const showWarningOnAddressesDialog = ref(false)

const notifications = ref<Notifications | null>(null)
const isNotificationsAllowed = computed(() => {
  return store.state.options.isAllowNotifications
})
const isBackgroundFetchNotification = computed(() => {
  console.log(
    '🚀 ~ App.vue:36 ~ isBackgroundFetchNotification ~ isNotificationsAllowed.value:',
    isNotificationsAllowed.value
  )
  return (
    isNotificationsAllowed.value &&
    store.state.options.allowNotificationType === notificationType['Background Fetch']
  )
})
const isPushNotification = computed(() => {
  console.log(
    '🚀 ~ App.vue:39 ~ isPushNotification ~ isNotificationsAllowed.value :',
    isNotificationsAllowed.value
  )
  return (
    isNotificationsAllowed.value &&
    store.state.options.allowNotificationType === notificationType['Push']
  )
})
const myPK = computed(() => {
  return store.getters.getMyPK
})

const themeName = computed(() => {
  return store.state.options.darkTheme ? ThemeName.Dark : ThemeName.Light
})

watch(myPK, (newVal, oldVal) => {
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
})

const { locale } = useI18n()

const onKeydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isSnackbarShowing.value) {
      e.stopPropagation()
      store.commit('snackbar/changeState', false)
    }
  }
}

const setLocale = () => {
  // Set language from `localStorage`.
  //
  // This is required only when initializing the application.
  // Subsequent mutations of `language.currentLocale`
  // will be synchronized with `i18n.locale`.
  const localeFromStorage = store.state.language.currentLocale
  locale.value = localeFromStorage
  dayjs.locale(localeFromStorage)
}

const registerCustomWorker = async () => {
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

onMounted(() => {
  if (isBackgroundFetchNotification.value) {
    const instance = getCurrentInstance()

    if (instance) {
      const notifications = new Notifications(instance.proxy)
      notifications.start()
    }
  }

  window.addEventListener('keydown', onKeydownHandler, true)
})

onBeforeUnmount(() => {
  notifications.value?.stop()
  store.dispatch('stopInterval')

  window.removeEventListener('keydown', onKeydownHandler, true)
})

setLocale()
if (isPushNotification.value) registerCustomWorker()
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
