import Queue from 'promise-queue'
import adamant from './adamant.js'
import config from '../config.json'
import sodium from 'sodium-browserify-tweetnacl'
import nacl from 'tweetnacl/nacl-fast'
import ed2curve from 'ed2curve'
import * as stablelib from '@stablelib/utf8'
// TODO: we use axios only in that file now. Move it to separate file later.
import axios from 'axios'

import renderMarkdown from './markdown'
import { hexToBytes, bytesToHex } from './hex'

Queue.configure(window.Promise)
window.queue = new Queue(1, Infinity)
if (!window.pk_cache) {
  window.pk_cache = {}
}

function install (Vue) {
  Vue.prototype.localStorageSupported = function () {
    var supported = true
    try {
      var ls = window.localStorage
      var test = '__hz-ls-test__'
      ls.setItem(test, test)
      ls.removeItem(test)
    } catch (e) {
      supported = false
    }
    return supported
  }
  Vue.prototype.parseURI = function (uri) {
    return adamant.parseURI(uri)
  }
  Vue.prototype.getAddressString = function (cached) {
    // TODO: add health check
    if (cached && this.$store.state.connectionString && this.$store.state.connectionString !== 'undefined' && this.$store.state.connectionString !== undefined) {
      return this.$store.state.connectionString
    }
    const servers = config.server.adm
    const server = servers[Math.floor(Math.random() * servers.length)]
    if (!server.protocol) {
      server.protocol = 'http'
    }
    var connectString = server.protocol + '://' + server.ip
    if (server.port) {
      connectString += ':' + server.port
    }
    this.$store.commit('connect', {'string': connectString})
    return connectString
  }
  Vue.prototype.getKeypair = function () {
    if (window.privateKey) {
      return {
        publicKey: window.publicKey,
        privateKey: window.privateKey
      }
    }
    var hash = adamant.createPassPhraseHash(this.$store.getters.getPassPhrase)
    var keypair = adamant.makeKeypair(hash)
    window.privateKey = keypair.privateKey
    window.publicKey = keypair.publicKey
    return keypair
  }
  Vue.prototype.getPublicKeyFromPassPhrase = function (passPhrase) {
    var keypair
    if (this.$store.getters.getPassPhrase) {
      keypair = this.getKeypair()
    } else {
      let hash = adamant.createPassPhraseHash(passPhrase)
      keypair = adamant.makeKeypair(hash)
      window.privateKey = keypair.privateKey
      window.publicKey = keypair.publicKey
    }
    return keypair.publicKey.toString('hex')
  }
  Vue.prototype.createNewAccount = function (publicKey, callback) {
    this.$store.commit('ajax_start')
    axios.post(this.getAddressString() + '/api/accounts/new', { publicKey: publicKey }).then(response => {
      if (response.data.success) {
        response.data.account.balance = response.data.account.balance / 100000000
        response.data.account.unconfirmedBalance = response.data.account.unconfirmedBalance / 100000000
        response.data.account.publicKey = publicKey
        response.data.account.is_new_account = true
        this.$store.commit('login', response.data.account)
        if (callback) {
          callback.call(this)
        }
        this.$store.commit('ajax_end')
      } else {
        alert(response.data.error)
        this.$store.commit('ajax_end_with_error')
      }
    }, response => {
      // error callback
    })
  }
  Vue.prototype.getAccountByPublicKey = function (publicKey, callback) {
    this.$store.commit('ajax_start')
    axios.get(this.getAddressString(true) + '/api/accounts?publicKey=' + publicKey).then(response => {
      if (response.data.success) {
        response.data.account.balance = response.data.account.balance / 100000000
        response.data.account.unconfirmedBalance = response.data.account.unconfirmedBalance / 100000000
        response.data.account.publicKey = publicKey
        this.$store.dispatch('updateAccount', response.data.account)
        if (callback) {
          callback.call(this)
        }
        this.$store.commit('ajax_end')
      } else if (response.data.error === 'Account not found') {
        this.createNewAccount(publicKey, callback)
      }
    }, response => {
      // error callback
    })
  }
  Vue.prototype.getAccountByPassPhrase = function (passPhrase, callback, errorCallBack) {
    try {
      var publicKey = this.getPublicKeyFromPassPhrase(passPhrase)
    } catch (e) {
      errorCallBack(e)
    }
    this.getAccountByPublicKey(publicKey, callback)
  }

  Vue.prototype.encodeMessage = function (msg, recipientPublicKey) {
    let nonce = Buffer.allocUnsafe(24)
    sodium.randombytes(nonce)
    let plainText = Buffer.from(msg)
    var keypair = this.getKeypair()
    let DHPublicKey = ed2curve.convertPublicKey(hexToBytes(recipientPublicKey))
    let DHSecretKey
    if (window.secretKey) {
      DHSecretKey = window.secretKey
    } else {
      DHSecretKey = ed2curve.convertSecretKey(keypair.privateKey)
      window.secretKey = DHSecretKey
    }

    let encrypted = nacl.box(plainText, nonce, DHPublicKey, DHSecretKey)
    return {
      message: bytesToHex(encrypted),
      own_message: bytesToHex(nonce)
    }
  }
  Vue.prototype.decodeMessage = function (msg, senderPublicKey, nonce) {
    var DHPublicKey = ed2curve.convertPublicKey(senderPublicKey)
    var DHSecretKey
    var keypair = this.getKeypair()
    if (window.secretKey) {
      DHSecretKey = window.secretKey
    } else {
      DHSecretKey = ed2curve.convertSecretKey(keypair.privateKey)
      window.secretKey = DHSecretKey
    }
    var decrypted = nacl.box.open(msg, nonce, DHPublicKey, DHSecretKey)
    if (!decrypted) {
      return ''
    }
    return stablelib.decode(decrypted)
  }
  Vue.prototype.getAddressPublicKey = function (recipientAddress) {
    if (window.pk_cache[recipientAddress]) {
      return Promise.resolve(window.pk_cache[recipientAddress])
    }
    return axios.get(this.getAddressString() + '/api/accounts/getPublicKey?address=' + recipientAddress).then(response => {
      if (response.data.success) {
        window.pk_cache[recipientAddress] = response.data.publicKey
        this.$store.commit('save_partner_public_key', {recipientAddress: recipientAddress, publicKey: response.data.publicKey})
        return response.data.publicKey
      }

      return null
    })
  }
  Vue.prototype.encodeMessageForAddress = function (msg, recipientAddress, caller) {
    axios.get(this.getAddressString() + '/api/accounts/getPublicKey?address=' + recipientAddress).then(response => {
      if (response.data.success) {
        var msgObject = this.encodeMessage(msg, response.data.publicKey)
        // msgObject.message = msgObject.message.toString('hex')
        // msgObject.own_message = msgObject.own_message.toString('hex')
        this.sendMessage(msgObject, recipientAddress)
      }
    }, response => {
      if (caller) {
        caller.message = msg
        caller.errorMessage('no_connection')
      }
      // error callback
    })
  }
  Vue.prototype.sendMessage = function (msg, recipient) {
    if (this.$store.getters.getPassPhrase) {
      this.$store.commit('ajax_start')
      var keypair = this.getKeypair()
      var transaction = {}
      transaction.type = 8
      transaction.amount = 0
      transaction.recipientId = recipient
      transaction.publicKey = keypair.publicKey.toString('hex')
      transaction.senderId = this.$store.state.address
      transaction.asset = {}
      transaction.asset.chat = msg
      this.normalizeMessageTransaction(transaction)
    }
  }
  Vue.prototype.processMessageTransaction = function (transaction) {
    axios.post(this.getAddressString() + '/api/chats/process', {
      transaction: transaction
    }).then(response => {
      if (response.data.success) {
        if (response.data.transactionId) {
          transaction.id = response.data.transactionId
          this.loadMessageTransaction(transaction)
          if (!this.$store.state.partnerName) {
            this.$store.commit('select_chat', transaction.recipientId)
            this.$store.commit('mark_as_read_total', transaction.recipientId)
            this.$store.commit('mark_as_read', transaction.recipientId)
            this.$root._router.push('/chats/' + transaction.recipientId + '/')
          }
          setTimeout((function (self) {
            return function () {
              self.needToScroll() // Thing you wanted to run as non-window 'this'
            }
          })(this), 1000)
        }
      } else {
      }
      this.$store.commit('ajax_end')
    },
    response => {
      this.$store.commit('ajax_end_with_error')
    })
  }
  Vue.prototype.normalizeMessageTransaction = function (transaction) {
    axios.post(this.getAddressString() + '/api/chats/normalize', {
      type: transaction.type,
      message: transaction.asset.chat.message,
      own_message: transaction.asset.chat.own_message,
      message_type: 1,
      recipientId: transaction.recipientId,
      publicKey: transaction.publicKey,
      senderId: transaction.senderId
    }).then(response => {
      if (response.data.success) {
        var newTransaction = response.data.transaction
        var keypair = this.getKeypair()
        newTransaction.senderId = transaction.senderId
        newTransaction.signature = adamant.transactionSign(newTransaction, keypair)
        this.$store.commit('ajax_end')
        this.processMessageTransaction(newTransaction)
      } else {
        this.$store.commit('send_error', {msg: response.data.error})
        this.$store.commit('ajax_end')
      }
    }, response => {
      // error callback
      this.$store.commit('ajax_end_with_error')
    })
  }

  Vue.prototype.needToScroll = function () {
    var element = document.getElementsByClassName('chat_messages')[0]
    if (!element) {
      return
    }
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      return
    }
    element.scrollTop = element.scrollHeight - element.clientHeight
  }

  Vue.prototype.updateCurrentValues = function () {
    if (this.$store.getters.getPassPhrase && !this.$store.state.ajaxIsOngoing) {
      this.getAccountByPublicKey(this.getPublicKeyFromPassPhrase(this.$store.getters.getPassPhrase))
      this.$store.commit('start_tracking_new')
      this.loadChats()
      // TODO: Remove this, when it will be possible to fetch transactions together with the chat messages
      this.$store.dispatch('adm/getNewTransactions')
    } else if (this.$store.state.ajaxIsOngoing && !window.resetAjaxState) {
      window.resetAjaxState = setTimeout(
        (function (self) {
          return function () {
            window.resetAjaxState = false
            self.$store.commit('ajax_end')
          }
        })(this),
        10000
      )
    }
  }
  Vue.prototype.loadMessageTransaction = function (currentTransaction) {
    if (currentTransaction === null || !currentTransaction) {
      this.messageProcessed()
      return
    }
    var currentAddress = this.$store.state.address

    if (currentTransaction.type > 0) {
      const promise = currentTransaction.recipientId !== currentAddress
        ? window.queue.add(() => this.getAddressPublicKey(currentTransaction.recipientId))
        : Promise.resolve(currentTransaction.senderPublicKey)

      promise
        .then(decodePublic => {
          decodePublic = hexToBytes(decodePublic)
          var message = hexToBytes(currentTransaction.asset.chat.message)
          var nonce = hexToBytes(currentTransaction.asset.chat.own_message)
          currentTransaction.message = this.decodeMessage(message, decodePublic, nonce)

          if (currentTransaction.asset.chat.type === 2) {
            currentTransaction.message = JSON.parse(currentTransaction.message)
            this.$store.commit('add_chat_message', currentTransaction)
          } else {
            if ((currentTransaction.message.indexOf('chats.welcome_message') > -1 && currentTransaction.senderId === 'U15423595369615486571') || (currentTransaction.message.indexOf('chats.preico_message') > -1 && currentTransaction.senderId === 'U7047165086065693428') || (currentTransaction.message.indexOf('chats.ico_message') > -1 && currentTransaction.senderId === 'U7047165086065693428')) {
              // TODO: is that 'if' condition required?
              // currentTransaction.message = this.$i18n.t('chats.welcome_message')
            } else {
              currentTransaction.message = renderMarkdown(currentTransaction.message)
            }

            if (currentTransaction.message && currentTransaction.message.length > 0) {
              if ((currentTransaction.message.indexOf('chats.welcome_message') > -1 && currentTransaction.senderId === 'U15423595369615486571') || (currentTransaction.message.indexOf('chats.preico_message') > -1 && currentTransaction.senderId === 'U7047165086065693428') || (currentTransaction.message.indexOf('chats.ico_message') > -1 && currentTransaction.senderId === 'U7047165086065693428')) {
                if (currentTransaction.senderId === 'U15423595369615486571') {
                  currentTransaction.message = 'chats.welcome_message'
                }
                if (currentTransaction.senderId === 'U7047165086065693428') {
                  currentTransaction.message = 'chats.ico_message'
                }
                this.$store.dispatch('add_chat_i18n_message', currentTransaction)
              } else {
                this.$store.commit('add_chat_message', currentTransaction)
              }
            }
          }
        })
        .catch(err => console.warn('Failed to parse incoming message', err))
        .then(() => this.messageProcessed())
    }
  }
  Vue.prototype.loadChats = function (initialCall, offset) {
    this.$store.commit('ajax_start')
    var queryString = this.getAddressString(true) + '/api/chats/get/?isIn=' + this.$store.state.address
    if (this.$store.state.lastChatHeight && !offset && !initialCall) {
      queryString += '&fromHeight=' + this.$store.state.lastChatHeight
    }
    if (offset) {
      queryString += '&offset=' + offset
    }
    queryString += '&orderBy=timestamp:desc'
    axios.get(queryString).then(response => {
      var haveSubseqs = false
      if (response.data.success) {
        for (var i in response.data.transactions) {
          if (response.data.transactions[i] === null || !response.data.transactions[i]) {
            continue
          }
          this.$store.commit('set_last_chat_height', response.data.transactions[i].height)
          if (!window.queuedMessages) {
            window.queuedMessages = 0
          }
          window.queuedMessages++
          this.loadMessageTransaction(response.data.transactions[i])
        }
        if (response.data.transactions.length === 100) {
          var newOffset = offset
          if (!newOffset) {
            newOffset = 0
          }
          newOffset = newOffset + 100
          haveSubseqs = true
          this.loadChats(initialCall, newOffset)
        }
        this.$store.commit('ajax_end')
      } else {
        this.$store.commit('ajax_end_with_error')
      }
      if (!haveSubseqs && initialCall) {
        this.timeoutLoader()
      }
    }, response => {
      this.$store.commit('ajax_end_with_error')
    })
  }
  Vue.prototype.timeoutLoader = function () {
    if (this.$store.state.firstChatLoad) {
      if (window.loadTimeout) {
        clearTimeout(window.loadTimeout)
      }
      window.loadTimeout = setTimeout(function () {
        window.ep.$store.commit('have_loaded_chats')
      }, 7000)
    }
  }
  Vue.prototype.messageProcessed = function () {
    window.queuedMessages--
    this.timeoutLoader()
    if (window.queuedMessages < 1 && this.$store.state.firstChatLoad) {
      this.$store.commit('have_loaded_chats')
    }
  }

  Vue.prototype.checkUnconfirmedTransactions = function () {
    this.$store.commit('ajax_start')
    axios.get(this.getAddressString() + '/api/transactions/unconfirmed').then(response => {
      if (response.data.success) {
        if (response.data.count === 0) {
          this.$store.commit('set_last_transaction_status', true)
          // this.$store.commit('ajax_end')
        } else {
          this.checkUnconfirmedTransactions()
        }
      } else {
        this.$store.commit('ajax_end_with_error')
      }
    }, () => {
      this.$store.commit('ajax_end_with_error')
    })
  }
}

export default install

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(install)
  if (install.installed) {
    install.installed = false
  }
}
