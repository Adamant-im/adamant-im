<template>
  <v-app :dark="isDarkTheme">
    <component :is="layout" class="application--linear-gradient">
      <router-view/>
    </component>
  </v-app>
</template>

<script>
import i18n from '@/i18n'
import Blinker from '@/lib/blinker'
import Notify from 'notifyjs'

export default {
  created () {
    this.setLocale()
    if (this.isLogged) {
      this.$store.dispatch('unlock')
    }
    if (Notify.needsPermission) {
      if (Notify.isSupported()) {
        Notify.requestPermission()
      }
    }
  },
  mounted () {
    this.almostSocket()
  },
  beforeDestroy () {
    this.blinker.stop()
    clearInterval(this.intervalRef)
  },
  computed: {
    layout () {
      return this.$route.meta.layout || 'default'
    },
    numOfNewMessages () {
      return this.$store.getters['chat/totalNumOfNewMessages']
    },
    userAllowTabNotifications () {
      return this.$store.state.options.allowTabNotifications
    },
    userAllowSoundNotifications () {
      return this.$store.state.options.allowSoundNotifications
    },
    userAllowPushNotifications () {
      return this.$store.state.options.allowPushNotifications
    },
    isLogged () {
      return this.$store.getters.isLogged
    },
    lastUnreadMessage () {
      return this.$store.getters['chat/lastUnreadMessage']
    },
    /**
     * Returns `partnerName` or `partnerId` from `lastUnreadMessage`
     * @returns {string}
     */
    partnerName () {
      const partnerId = this.lastUnreadMessage && this.lastUnreadMessage.senderId

      if (partnerId) {
        return this.$store.getters['partners/displayName'](partnerId)
      }

      return ''
    },
    isDarkTheme () {
      return this.$store.state.options.darkTheme
    }
  },
  data: () => ({
    blinker: null,
    intervalRef: null,
    prevNumOfMessages: 0,
    browserNotification: {
      body: null,
      tag: null,
      timeout: 5
    }
  }),
  methods: {
    almostSocket () {
      this.blinker = new Blinker(this.$t('app_title'))

      this.intervalRef = setInterval(() => {
        this.$store.dispatch('update')
        this.checkForNewMessages()
      }, 3000)
    },
    checkForNewMessages () {
      this.handleTabNotifications()
      this.handleSoundNotifications()
      this.handlePushNotifications()

      // save previous number of messages
      // to avoid endless notifications
      this.prevNumOfMessages = this.numOfNewMessages
    },
    handleTabNotifications () {
      if (
        this.userAllowTabNotifications &&
        this.numOfNewMessages > 0
      ) {
        let notificationMessage = this.numOfNewMessages % 10 > 4
          ? this.$tc('notifications.message.many', this.numOfNewMessages)
          : this.$tc('notifications.message.few', this.numOfNewMessages)

        this.blinker.start(notificationMessage)
      } else {
        this.blinker.stop()
      }
    },
    handleSoundNotifications () {
      if (
        this.userAllowSoundNotifications &&
        this.numOfNewMessages > this.prevNumOfMessages
      ) {
        this.$store.dispatch('noise/play')
      }
    },
    handlePushNotifications () {
      if (
        this.userAllowPushNotifications &&
        this.numOfNewMessages > this.prevNumOfMessages
      ) {
        if (this.lastUnreadMessage) {
          const tag = this.lastUnreadMessage.id

          // Message not shown yet
          if (tag !== this.browserNotification.tag) {
            this.browserNotification = {
              body: `${this.partnerName}: ${this.lastUnreadMessage.message}`,
              tag
            }
            this.sendPushNotification()
          }
        }
      }
    },
    sendPushNotification () {
      const notification = new Notify('ADAMANT', this.browserNotification)
      notification.show()
    },
    setLocale () {
      // Set language from `localStorage`.
      //
      // This is required only when initializing the application.
      // Subsequent mutations of `language.currentLocale`
      // will be synchronized with `i18n.locale`.
      const localeFromStorage = this.$store.state.language.currentLocale

      i18n.locale = localeFromStorage
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
