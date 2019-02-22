'use strict'

import Notify from 'notifyjs'
import Visibility from 'visibilityjs'

class PushNotification {
  constructor (ctx) {
    this.i18n = ctx.$i18n
    this.route = ctx.$route
    this.store = ctx.$store
    if (Notify.needsPermission) {
      if (Notify.isSupported()) {
        Notify.requestPermission()
      }
    }
    this.opts = {
      body: null,
      tag: null,
      timeout: 5
    }
  }
  get unreadAmount () {
    return this.store.getters['chat/totalNumOfNewMessages']
  }
  notify (prevAmount, lastUnread, partnerIdentity) {
    if (this.unreadAmount > prevAmount) {
      if (lastUnread) {
        const tag = lastUnread.id
        // Message not shown yet
        if (tag !== this.opts.tag) {
          this.opts = {
            body: `${partnerIdentity}: ${lastUnread.message}`,
            tag
          }
          this.showNotification()
        }
      }
    }
  }
  showNotification () {
    const notification = new Notify(this.i18n.t('app_title'), this.opts)
    notification.show()
  }
}

class SoundNotification {
  constructor (ctx) {
    this.i18n = ctx.$i18n
    this.route = ctx.$route
    this.store = ctx.$store
    this.audio = new Audio('/sound/bbpro_link.mp3')
  }
  get unreadAmount () {
    return this.store.getters['chat/totalNumOfNewMessages']
  }
  notify (prevAmount) {
    if (this.unreadAmount > prevAmount) {
      this.audio.play()
    }
  }
}

class TabNotification {
  constructor (ctx) {
    this.i18n = ctx.$i18n
    this.route = ctx.$route
    this.store = ctx.$store
    this.interval = null
    this.showAmount = true
  }
  get unreadAmount () {
    return this.store.getters['chat/totalNumOfNewMessages']
  }
  notify () {
    if (this.unreadAmount > 0) {
      if (!this.interval) {
        this.showAmount = true
        this.start()
      }
    }
  }
  start () {
    this.interval = window.setInterval(() => {
      if (this.unreadAmount > 0 && this.showAmount) {
        if (this.unreadAmount < 100) {
          document.title = this.i18n.tc('notifications.tabMessage.few', this.unreadAmount)
        } else {
          document.title = this.i18n.t('notifications.tabMessage.many')
        }
      } else document.title = this.i18n.t('app_title')
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

export default class Notifications {
  constructor (ctx) {
    this.i18n = ctx.$i18n
    this.route = ctx.$route
    this.store = ctx.$store
    this.interval = null
    this.prevAmount = 0
    this.push = new PushNotification(ctx)
    this.sound = new SoundNotification(ctx)
    this.tab = new TabNotification(ctx)
  }
  get chatHidden () {
    return !(
      this.route.name === 'Chat' &&
      typeof this.route.params.partnerId === 'string' &&
      this.route.params.partnerId === this.partnerAddress
    )
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
  start () {
    this.interval = window.setInterval(() => {
      if (this.pushAllowed && this.tabHidden) {
        this.push.notify(this.prevAmount, this.lastUnread, this.partnerIdentity)
      }
      if (this.soundAllowed && this.lastUnread) {
        this.sound.notify(this.prevAmount)
      }
      if (this.tabAllowed && this.lastUnread && (this.chatHidden || this.tabHidden)) {
        this.tab.notify()
      } else {
        this.tab.stop()
      }
      if (!this.chatHidden && !this.tabHidden) {
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
