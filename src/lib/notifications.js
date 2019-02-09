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
  checkNewMessages (lastUnread, partnerIdentity, amount) {
    if (amount.unread > amount.prev) {
      if (lastUnread) {
        const tag = lastUnread.id
        // Message not shown yet
        if (tag !== this.opts.tag) {
          this.opts = {
            body: `${partnerIdentity}: ${lastUnread.message}`,
            tag
          }
          this.sendNotification()
        }
      }
    }
  }
  sendNotification () {
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
  checkNewMessages (amount) {
    if (amount.unread > amount.prev) {
      this.audio.play()
    }
  }
}

class TabNotification {
  constructor (ctx) {
    this.i18n = ctx.$i18n
    this.route = ctx.$route
    this.store = ctx.$store
    this.documentTitle = this.i18n.t('app_title')
  }
  stop () {
    window.clearInterval(this.interval)
    this.interval = null
    document.title = this.documentTitle
  }
  checkNewMessages (unreadAmount) {
    this.stop()
    if (unreadAmount > 0) {
      let isNotify = false
      if (this.interval) return
      this.interval = window.setInterval(() => {
        isNotify = !isNotify
        if (isNotify) {
          if (unreadAmount < 100) {
            document.title = this.i18n.tc('notifications.tabMessage.few')
          } else {
            document.title = this.i18n.t('notifications.tabMessage.many')
          }
        } else {
          document.title = this.documentTitle
        }
      }, 1e3)
    }
  }
}

export default class Notifications {
  constructor (ctx) {
    this.i18n = ctx.$i18n
    this.route = ctx.$route
    this.store = ctx.$store
    /* eslint no-fallthrough: "off" */
    switch (true) {
      case this.pushAllowed: this.push = new PushNotification(ctx)
      case this.soundAllowed: this.sound = new SoundNotification(ctx)
      case this.tabAllowed: this.tab = new TabNotification(ctx)
    }
    this.interval = window.setInterval(() => {
      this.lastUnreadMessage = this.store.getters['chat/lastUnreadMessage']
      const chatUnread = this.route.params.partner !== this.partnerAddress
      const pageHidden = Visibility.hidden()
      /* eslint no-fallthrough: "off" */
      switch (true) {
        case this.pushAllowed && pageHidden: this.push.checkNewMessages(
          this.lastUnreadMessage, this.partnerIdentity, {
            prev: this.prevMessagesAmount,
            unread: this.unreadMessagesAmount
          }
        )
        case this.soundAllowed && chatUnread: this.sound.checkNewMessages(
          {
            prev: this.prevMessagesAmount,
            unread: this.unreadMessagesAmount
          }
        )
        case this.tabAllowed && chatUnread: this.tab.checkNewMessages(
          this.unreadMessagesAmount
        )
      }
      if (!chatUnread) {
        this.store.commit('chat/markAsRead', this.partnerAddress)
      }
      this.prevMessagesAmount = this.unreadMessagesAmount
    }, 3e3)
  }
  get partnerAddress () {
    return this.lastUnreadMessage && this.lastUnreadMessage.senderId
  }
  get partnerIdentity () {
    return this.store.getters['contacts/contactName'](this.partnerAddress) || this.partnerAddress
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
  get unreadMessagesAmount () {
    return this.store.getters['chat/totalNumOfNewMessages']
  }
  stop () {
    window.clearInterval(this.interval)
    this.tab.stop()
  }
  update (ctx) {
    this.route = ctx.$route
  }
}
