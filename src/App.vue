<template>
  <v-app :theme="themeName" class="application--linear-gradient">
    <UploadAttachmentExitPrompt />
    <warning-on-addresses-dialog v-model="showWarningOnAddressesDialog" />

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import WarningOnAddressesDialog from '@/components/WarningOnAddressesDialog.vue'
import UploadAttachmentExitPrompt from '@/components/UploadAttachmentExitPrompt.vue'
import Notifications from '@/lib/notifications'
import { ThemeName } from './plugins/vuetify'
import { useStore } from 'vuex'

export default defineComponent({
  components: {
    WarningOnAddressesDialog,
    UploadAttachmentExitPrompt
  },
  setup() {
    const store = useStore()
    const isSnackbarShowing = computed(() => store.state.snackbar.show)

    const onKeydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSnackbarShowing.value) {
          e.stopPropagation()
          store.commit('snackbar/changeState', false)
        }
      }
    }

    window.addEventListener('keydown', onKeydownHandler, true)

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', onKeydownHandler, true)
    })
  },
  data: () => ({
    showWarningOnAddressesDialog: false,
    notifications: null as Notifications | null
  }),
  computed: {
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

<style lang="scss" scoped>
@use '@/assets/styles/themes/adamant/_mixins.scss';

.v-theme--light.application--linear-gradient {
  @include mixins.linear-gradient-light();
}
.v-theme--dark.application--linear-gradient {
  @include mixins.linear-gradient-dark();
}
</style>
