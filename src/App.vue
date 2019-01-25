<template>
  <v-app :dark="isDarkTheme">
    <component :is="layout" class="application--linear-gradient">
      <router-view/>
    </component>
  </v-app>
</template>

<script>
import Notifications from '@/lib/notifications'

export default {
  created () {
    this.setLocale()
    if (this.isLogged) {
      this.$store.dispatch('unlock')
    }
  },
  mounted () {
    this.notifications = new Notifications(this)
    this.interval = window.setInterval(() => {
      this.$store.dispatch('update')
    }, 3000)
  },
  updated () {
    this.notifications.update(this)
  },
  beforeDestroy () {
    this.notifications.stop()
    window.clearInterval(this.interval)
  },
  computed: {
    layout () {
      return this.$route.meta.layout || 'default'
    },
    isLogged () {
      return this.$store.getters.isLogged
    },
    isDarkTheme () {
      return this.$store.state.options.darkTheme
    }
  },
  data: () => ({
    interval: null
  }),
  methods: {
    setLocale () {
      // Set language from `localStorage`.
      //
      // This is required only when initializing the application.
      // Subsequent mutations of `language.currentLocale`
      // will be synchronized with `i18n.locale`.
      const localeFromStorage = this.$store.state.language.currentLocale
      this.$i18n.locale = localeFromStorage
    }
  }
}
</script>

<style lang="stylus" scoped>
.theme--light.application--linear-gradient
  background: repeating-linear-gradient(
    140deg,
    #f6f6f6,
    #f6f6f6 1px,
    #fefefe 0,
    #fefefe 5px
  )
</style>
