<template>
  <v-app :dark="isDarkTheme" class="application--linear-gradient">
    <TransitionEffect>
      <component :is="layout">
        <router-view />
      </component>
    </TransitionEffect>
  </v-app>
</template>

<script>
import dayjs from 'dayjs'

import TransitionEffect from '@/components/TransitionEffect'
import Notifications from '@/lib/notifications'
import AppInterval from '@/lib/AppInterval'

export default {
  created () {
    this.setLocale()
  },
  mounted () {
    this.notifications = new Notifications(this)
    this.notifications.start()
  },
  updated () {
    this.notifications.update(this)
  },
  beforeDestroy () {
    this.notifications.stop()
    AppInterval.unsubscribe()
  },
  components: { TransitionEffect },
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

<style lang="stylus" scoped>
.theme--light.application--linear-gradient
  background: repeating-linear-gradient(
    140deg,
    #f6f6f6,
    #f6f6f6 0.7px,
    #fefefe 0,
    #fefefe 5px
  )
.theme--dark.application--linear-gradient
  background: repeating-linear-gradient(
    140deg,
    #191919,
    #191919 0.7px,
    #212121 0,
    #212121 5px
  )
</style>
