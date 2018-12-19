<template>
  <div>
    <component :is="layout" class="application--linear-gradient">
      <router-view/>
    </component>
  </div>
</template>

<script>
import i18n from '@/i18n'
import Blinker from '@/lib/blinker'

export default {
  created () {
    this.setLocale()
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
      return this.$store.state.totalNewChats
    },
    userAllowNotifications () {
      return this.$store.state.notifyBar
    },
    userAllowSoundNotifications () {
      return this.$store.state.notifySound
    }
  },
  data: () => ({
    blinker: null,
    intervalRef: null,
    prevNumOfMessages: 0
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
      if (this.numOfNewMessages > 0 && this.userAllowNotifications) {
        // Tab notification
        let notificationMessage = this.numOfNewMessages % 10 > 4
          ? this.$tc('newMessageNotification.many', this.numOfNewMessages)
          : this.$tc('newMessageNotification.few', this.numOfNewMessages)

        this.blinker.start(notificationMessage)

        // Sound notification
        if (
          this.userAllowSoundNotifications &&
          this.numOfNewMessages > this.prevNumOfMessages
        ) {
          this.$store.dispatch('noise/play')
          this.prevNumOfMessages = this.numOfNewMessages
        }
      } else {
        this.blinker.stop()
      }
    },
    setLocale () {
      // Set language from `localStorage`.
      //
      // This is required only when initializing the application.
      // Subsequent mutations of `languageModule.currentLocale`
      // will be synchronized with `i18n.locale`.
      const localeFromStorage = this.$store.state.languageModule.currentLocale

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

<i18n>
  {
    "en": {
      "newMessageNotification": {
      "few": "no messages | 1 new message | {n} new messages",
      "many": "{n} new messages"
    }
  },
  "ru": {
    "newMessageNotification": {
      "few": "нет новых сообщений | 1 новое сообщение | {n} новых сообщения",
      "many": "{n} новых сообщений"
    }
  },
    "fr": {
    "newMessageNotification": {
      "few": "0 nouveaux message | 1 nouveaux message | {n} nouveaux messages",
      "many": "{n} nouveaux messages"
    }
  },
  "de": {
    "newMessageNotification": {
      "few": "0 Neue Nachricht | 1 Neue Nachricht | {n} Neue Nachrichten",
      "many": "{n} Neue Nachrichten"
    }
  },
  "ar": {
    "newMessageNotification": {
      "few": "no messages | 1 new message | {n} new messages",
      "many": "{n} new messages"
    }
  }
}
</i18n>
