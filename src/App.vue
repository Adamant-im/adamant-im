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
import { computed, onBeforeUnmount, onMounted, getCurrentInstance, ref } from 'vue'
import dayjs from 'dayjs'
import WarningOnAddressesDialog from '@/components/WarningOnAddressesDialog.vue'
import UploadAttachmentExitPrompt from '@/components/UploadAttachmentExitPrompt.vue'
import Notifications from '@/lib/notifications'
import { ThemeName } from './plugins/vuetify'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useResendPendingMessages } from '@/hooks/useResendPendingMessages'

useResendPendingMessages()

const store = useStore()
const isSnackbarShowing = computed(() => store.state.snackbar.show)

const showWarningOnAddressesDialog = ref(false)

const notifications = ref<Notifications | null>(null)

const themeName = computed(() => {
  return store.state.options.darkTheme ? ThemeName.Dark : ThemeName.Light
})

const { locale } = useI18n()

onMounted(() => {
  const instance = getCurrentInstance()

  if (instance) {
    const notifications = new Notifications(instance.proxy)
    notifications.start()
  }
})

onBeforeUnmount(() => {
  notifications.value?.stop()
  store.dispatch('stopInterval')
})

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

onMounted(() => {
  window.addEventListener('keydown', onKeydownHandler, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydownHandler, true)
})

setLocale()
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
