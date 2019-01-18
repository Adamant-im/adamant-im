'use strict'

import Blinker from '@/lib/blinker'
import Notify from 'notifyjs'
import Visibility from 'visibilityjs'

class PushNotification {
  constructor (i18n, store) {
    this.i18n = i18n
    this.store = store
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
    const notification = new Notify('ADAMANT', this.opts)
    notification.show()
  }
}

class SoundNotification {
  constructor (i18n, store) {
    this.i18n = i18n
    this.store = store
  }
  checkNewMessages (amount) {
    if (amount.unread > amount.prev) {
      this.store.dispatch('noise/play')
    }
  }
}

class TabNotification {
  constructor (i18n, store) {
    this.i18n = i18n
    this.store = store
    this.blinker = new Blinker(this.i18n.t('app_title'))
  }
  stop () {
    this.blinker.stop()
  }
  checkNewMessages (unreadAmount, note) {
    if (unreadAmount > 0) {
      this.blinker.start(unreadAmount % 10 > 4 ? note.many : note.few)
    } else {
      this.blinker.stop()
    }
  }
}

export default class Notifications {
  constructor (i18n, store) {
    this.i18n = i18n
    this.store = store
    /* eslint no-fallthrough: "off" */
    switch (true) {
      case this.pushAllowed: this.push = new PushNotification(i18n, store)
      case this.soundAllowed: this.sound = new SoundNotification(i18n, store)
      case this.tabAllowed: this.tab = new TabNotification(i18n, store)
    }
    this.interval = window.setInterval(() => {
      this.lastUnreadMessage = this.store.getters['chat/lastUnreadMessage']
      Visibility.onVisible(() => {
        this.store.commit('chat/markAsRead', this.partnerAddress)
      })
      /* eslint no-fallthrough: "off" */
      switch (true) {
        case this.pushAllowed: this.push.checkNewMessages(
          this.lastUnreadMessage, this.partnerIdentity, {
            prev: this.prevMessagesAmount,
            unread: this.unreadMessagesAmount
          }
        )
        case this.soundAllowed: this.sound.checkNewMessages(
          {
            prev: this.prevMessagesAmount,
            unread: this.unreadMessagesAmount
          }
        )
        case this.tabAllowed: this.tab.checkNewMessages(
          this.unreadMessagesAmount, {
            few: this.i18n.tc('notifications.message.few', this.unreadMessagesAmount),
            many: this.i18n.tc('notifications.message.many', this.unreadMessagesAmount)
          }
        )
      }
      this.prevMessagesAmount = this.unreadMessagesAmount
    }, 3e3)
  }
  get partnerAddress () {
    return this.lastUnreadMessage && this.lastUnreadMessage.senderId
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
  get unreadMessagesAmount () {
    return this.store.getters['chat/totalNumOfNewMessages']
  }
  stop () {
    this.tab.stop()
    window.clearInterval(this.interval)
  }
}
