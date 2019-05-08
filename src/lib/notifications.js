'use strict'

import Notify from 'notifyjs'
import Visibility from 'visibilityjs'

class Notification {
  constructor (ctx) {
    this.i18n = ctx.$i18n
    this.route = ctx.$route
    this.store = ctx.$store
    this.interval = null
  }
  // Returns true once message appeared in chat
  get messageAppeared () {
    return this.route.name === 'Chat' &&
      this.route.params.partnerId && this.partnerAddress &&
      this.route.params.partnerId === this.partnerAddress
  }
  get lastUnread () {
    return this.store.getters['chat/lastUnreadMessage']
  }
  get partnerAddress () {
    return this.lastUnread && this.lastUnread.senderId
  }
  get partnerIdentity () {
    return this.store.getters['partners/displayName'](this.partnerAddress) || this.partnerAddress
  }
  get pushAllowed () {
    return this.store.state.options.allowPushNotifications
  }
  get soundAllowed () {
    return this.store.state.options.allowSoundNotifications
  }
  get tabAllowed () {
    return this.store.state.options.allowTabNotifications
  }
  get tabHidden () {
    return Visibility.hidden()
  }
  get unreadAmount () {
    return this.store.getters['chat/totalNumOfNewMessages']
  }
}

class PushNotification extends Notification {
  constructor (ctx) {
    super(ctx)
    this.options = {
      body: null,
      tag: null,
      timeout: 5
    }
  }
  notify (messageArrived) {
    try {
      Notify.requestPermission(
        // Permission granted
        () => {
          if (messageArrived && this.tabHidden) {
            if (this.lastUnread) {
              const tag = this.lastUnread.id
              // Message not shown yet
              if (tag !== this.options.tag) {
                this.options = {
                  body: `${this.partnerIdentity}: ${this.lastUnread.message}`,
                  tag
                }
                const notification = new Notify(this.i18n.t('app_title'), this.options)
                notification.show()
              }
            }
          }
        },
        // Permission denied
        () => {
          this.store.dispatch('snackbar/show', {
            message: this.i18n.t('options.push_denied')
          })
          this.store.commit('options/updateOption', {
            key: 'allowPushNotifications',
            value: false
          })
        }
      )
    } catch (x) {
      // Notification API not supported or another error
      console.error(x)
      this.store.dispatch('snackbar/show', {
        message: this.i18n.t('options.push_not_supported')
      })
      this.store.commit('options/updateOption', {
        key: 'allowPushNotifications',
        value: false
      })
    }
  }
}

class SoundNotification extends Notification {
  constructor (ctx) {
    super(ctx)
    this.audio = new Audio('/sound/bbpro_link.mp3')
  }
  notify (messageArrived) {
    if (messageArrived) {
      this.audio.play()
    }
  }
}

class TabNotification extends Notification {
  constructor (ctx) {
    super(ctx)
    this.showAmount = true
  }
  notify () {
    if (this.unreadAmount > 0 && (this.lastUnread || this.tabHidden)) {
      if (!this.interval) {
        this.showAmount = true
        this.start()
      }
    }
  }
  start () {
    this.interval = window.setInterval(() => {
      if (this.unreadAmount && this.showAmount) {
        if (this.unreadAmount < 100) {
          document.title = this.i18n.tc('notifications.tabMessage.few', this.unreadAmount)
        } else {
          document.title = this.i18n.t('notifications.tabMessage.many')
        }
      } else this.stop()
      this.showAmount = !this.showAmount
    }, 1e3)
  }
  stop () {
    if (this.interval) {
      window.clearInterval(this.interval)
      this.interval = null
      document.title = this.i18n.t('app_title')
    }
  }
}

export default class extends Notification {
  constructor (ctx) {
    super(ctx)
    this.prevAmount = 0
    this.push = new PushNotification(ctx)
    this.sound = new SoundNotification(ctx)
    this.tab = new TabNotification(ctx)
  }
  // Returns true once message arrived
  get messageArrived () {
    return this.unreadAmount > this.prevAmount
  }
  start () {
    this.interval = window.setInterval(() => {
      if (this.pushAllowed) {
        this.push.notify(this.messageArrived)
      }
      if (this.soundAllowed) {
        this.sound.notify(this.messageArrived)
      }
      if (this.tabAllowed) {
        this.tab.notify()
      }
      if (!this.tabHidden && this.messageAppeared) {
        this.store.commit('chat/markAsRead', this.partnerAddress)
      }
      this.prevAmount = this.unreadAmount
    }, 3e3)
  }
  stop () {
    if (this.interval) {
      window.clearInterval(this.interval)
      this.interval = null
      this.tab.stop()
    }
  }
  update (ctx) {
    this.route = ctx.$route
  }
}
