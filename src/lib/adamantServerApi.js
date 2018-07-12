import Queue from 'promise-queue'

var config = require('../config.json')
var adamant = require('./adamant.js')
const renderMarkdown = require('./markdown').default
const { hexToBytes, bytesToHex } = require('./hex')
const constants = require('./constants.js')
const adamantAPI = require('./adamant-api')

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
      var hash = adamant.createPassPhraseHash(passPhrase)
      keypair = adamant.makeKeypair(hash)
      window.privateKey = keypair.privateKey
      window.publicKey = keypair.publicKey
    }
    return keypair.publicKey.toString('hex')
  }
  Vue.prototype.createNewAccount = function (publicKey, callback) {
    this.$store.commit('ajax_start')
    this.$http.post(this.getAddressString() + '/api/accounts/new', { publicKey: publicKey }).then(response => {
      if (response.body.success) {
        response.body.account.balance = response.body.account.balance / 100000000
        response.body.account.unconfirmedBalance = response.body.account.unconfirmedBalance / 100000000
        response.body.account.publicKey = publicKey
        response.body.account.is_new_account = true
        this.$store.commit('login', response.body.account)
        if (callback) {
          callback.call(this)
        }
        this.$store.commit('ajax_end')
      } else {
        alert(response.body.error)
        this.$store.commit('ajax_end_with_error')
      }
    }, response => {
      // error callback
    })
  }
  Vue.prototype.getAccountByPublicKey = function (publicKey, callback) {
    this.$store.commit('ajax_start')
    this.$http.get(this.getAddressString(true) + '/api/accounts?publicKey=' + publicKey).then(response => {
      if (response.body.success) {
        response.body.account.balance = response.body.account.balance / 100000000
        response.body.account.unconfirmedBalance = response.body.account.unconfirmedBalance / 100000000
        response.body.account.publicKey = publicKey
        this.$store.dispatch('updateAccount', response.body.account)
        if (callback) {
          callback.call(this)
        }
        this.$store.commit('ajax_end')
      } else if (response.body.error === 'Account not found') {
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
    var sodium = require('sodium-browserify-tweetnacl')
    var nacl = require('tweetnacl/nacl-fast')
    var ed2curve = require('ed2curve')
    var nonce = Buffer.allocUnsafe(24)
    sodium.randombytes(nonce)
    var plainText = Buffer.from(msg)
    var keypair = this.getKeypair()
    var DHPublicKey = ed2curve.convertPublicKey(hexToBytes(recipientPublicKey))
    var DHSecretKey
    if (window.secretKey) {
      DHSecretKey = window.secretKey
    } else {
      DHSecretKey = ed2curve.convertSecretKey(keypair.privateKey)
      window.secretKey = DHSecretKey
    }

    var encrypted = nacl.box(plainText, nonce, DHPublicKey, DHSecretKey)
    return {
      message: bytesToHex(encrypted),
      own_message: bytesToHex(nonce)
    }
  }
  Vue.prototype.decodeMessage = function (msg, senderPublicKey, nonce) {
    var nacl = require('tweetnacl/nacl-fast')
    var ed2curve = require('ed2curve')
    var keypair = this.getKeypair()
    var DHPublicKey = ed2curve.convertPublicKey(senderPublicKey)
    var DHSecretKey
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
    return require('@stablelib/utf8').decode(decrypted)
  }
  Vue.prototype.getAddressPublicKey = function (recipientAddress) {
    if (window.pk_cache[recipientAddress]) {
      return Promise.resolve(window.pk_cache[recipientAddress])
    }
    return this.$http.get(this.getAddressString() + '/api/accounts/getPublicKey?address=' + recipientAddress).then(response => {
      if (response.body.success) {
        window.pk_cache[recipientAddress] = response.body.publicKey
        return response.body.publicKey
      }

      return null
    })
  }
  Vue.prototype.encodeMessageForAddress = function (msg, recipientAddress, caller) {
    this.$http.get(this.getAddressString() + '/api/accounts/getPublicKey?address=' + recipientAddress).then(response => {
      if (response.body.success) {
        var msgObject = this.encodeMessage(msg, response.body.publicKey)
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
    this.$http.post(this.getAddressString() + '/api/chats/process', {
      transaction: transaction
    }).then(response => {
      if (response.body.success) {
        if (response.body.transactionId) {
          transaction.id = response.body.transactionId
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
    this.$http.post(this.getAddressString() + '/api/chats/normalize', {
      type: transaction.type,
      message: transaction.asset.chat.message,
      own_message: transaction.asset.chat.own_message,
      message_type: 1,
      recipientId: transaction.recipientId,
      publicKey: transaction.publicKey,
      senderId: transaction.senderId
    }).then(response => {
      if (response.body.success) {
        var newTransaction = response.body.transaction
        var keypair = this.getKeypair()
        newTransaction.senderId = transaction.senderId
        newTransaction.signature = adamant.transactionSign(newTransaction, keypair)
        this.$store.commit('ajax_end')
        this.processMessageTransaction(newTransaction)
      } else {
        this.$store.commit('send_error', {msg: response.body.error})
        this.$store.commit('ajax_end')
      }
    }, response => {
      // error callback
      this.$store.commit('ajax_end_with_error')
    })
  }
  Vue.prototype.transferFunds = function (amount, recipient) {
    this.$store.commit('ajax_start')
    if (this.$store.getters.getPassPhrase) {
      var keypair = this.getKeypair()
      var transaction = {}
      transaction.type = 0
      amount = amount * 100000000
      transaction.amount = Math.round(amount)
      transaction.recipientId = recipient
      transaction.publicKey = keypair.publicKey.toString('hex')
      transaction.senderId = this.$store.state.address
      this.normalizeTransaction(transaction)
    }
  }
  Vue.prototype.processTransaction = function (transaction) {
    this.$http.post(this.getAddressString() + '/api/transactions/process', {
      transaction: transaction
    }).then(response => {
      if (response.body.success) {
        if (response.body.transactionId) {
          this.$root._router.push('/transactions/ADM/' + response.body.transactionId + '/')
        }
      } else {
      }
      this.$store.commit('ajax_end')
    },
    response => {
      this.$store.commit('ajax_end_with_error')
    })
  }
  Vue.prototype.isLastScroll = function () {
    var element = document.getElementsByClassName('chat_messages')[0]
    if (!element) {
      return false
    }
    var scrollDiff = element.scrollHeight - element.scrollTop - element.clientHeight
    if (scrollDiff > 5 || scrollDiff < -5) {
      return false
    }
    return true
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
  Vue.prototype.normalizeTransaction = function (transaction) {
    this.$http.post(this.getAddressString() + '/api/transactions/normalize', {
      type: transaction.type,
      amount: transaction.amount,
      recipientId: transaction.recipientId,
      publicKey: transaction.publicKey,
      senderId: transaction.senderId
    }).then(response => {
      if (response.body.success) {
        var newTransaction = response.body.transaction
        var keypair = this.getKeypair()
        newTransaction.senderId = transaction.senderId
        newTransaction.signature = adamant.transactionSign(newTransaction, keypair)
        this.processTransaction(newTransaction)
      } else {
        this.$store.commit('send_error', {msg: response.body.error})
        this.$store.commit('ajax_end')
      }
    }, response => {
      // error callback
      this.$store.commit('ajax_end_with_error')
    })
  }
  Vue.prototype.updateCurrentValues = function () {
    if (this.$store.getters.getPassPhrase && !this.$store.state.ajaxIsOngoing) {
      // updating wallet balance
      if (this.$route.path.indexOf('/transactions/') > -1) {
        if (this.$route.params.tx_id) {
          this.getTransactionInfo(this.$route.params.tx_id)
        }
      }
      this.getAccountByPublicKey(this.getPublicKeyFromPassPhrase(this.$store.getters.getPassPhrase))
      this.$store.commit('start_tracking_new')
      this.loadChats()
      this.getTransactions()
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
    var last = this.isLastScroll()
    this.$http.get(queryString).then(response => {
      var haveSubseqs = false
      if (response.body.success) {
        for (var i in response.body.transactions) {
          if (response.body.transactions[i] === null || !response.body.transactions[i]) {
            continue
          }
          this.$store.commit('set_last_chat_height', response.body.transactions[i].height)
          if (!window.queuedMessages) {
            window.queuedMessages = 0
          }
          window.queuedMessages++
          this.loadMessageTransaction(response.body.transactions[i])
        }
        if (response.body.transactions.length === 100) {
          var newOffset = offset
          if (!newOffset) {
            newOffset = 0
          }
          newOffset = newOffset + 100
          haveSubseqs = true
          this.loadChats(initialCall, newOffset)
        }
        if (last || this.isLastScroll()) {
          setTimeout((function (self) {
            return function () {
              self.needToScroll()
            }
          })(this), 1000)
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
  Vue.prototype.getUncofirmedTransactionInfo = function (txid) {
    this.$store.commit('ajax_start')
    this.$http.get(this.getAddressString() + '/api/transactions/unconfirmed/get?id=' + txid).then(response => {
      if (response.body.success) {
        if (!response.body.transaction) {
          response.body.transaction = 0
        }
        this.$store.commit('transaction_info', response.body.transaction)
        this.$store.commit('ajax_end')
      } else {
        this.$store.commit('ajax_end_with_error')
      }
    }, response => {
      this.$store.commit('ajax_end_with_error')
    })
  }
  Vue.prototype.getTransactions = function (offset) {
    const uri = [this.getAddressString(), '/api/transactions/?inId=', this.$store.state.address, '&and:type=0']
    if (this.$store.state.lastTransactionHeight) {
      uri.push('&and:fromHeight=', this.$store.state.lastTransactionHeight + 1)
    }
    this.$http.get(uri.join('')).then(response => {
      if (response.body.success) {
        for (var i in response.body.transactions) {
          if (response.body.transactions[i].type === 0) {
            this.$store.commit('transaction_info', response.body.transactions[i])
            this.$store.commit('set_last_transaction_height', response.body.transactions[i].height)
          }
        }
      }
    }, response => {
    })
  }
  Vue.prototype.getTransactionInfo = function (txid) {
    this.$store.commit('ajax_start')
    this.$http.get(this.getAddressString() + '/api/transactions/get?id=' + txid).then(response => {
      if (response.body.success) {
        this.$store.commit('transaction_info', response.body.transaction)
        this.$store.commit('ajax_end')
      } else {
        this.getUncofirmedTransactionInfo(txid)
      }
    }, response => {
      this.$store.commit('ajax_end_with_error')
    })
  }

  Vue.prototype.checkUnconfirmedTransactions = function () {
    this.$store.commit('ajax_start')
    this.$http.get(this.getAddressString() + '/api/transactions/unconfirmed').then(response => {
      if (response.body.success) {
        if (response.body.count === 0) {
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
  Vue.prototype.voteForDelegates = function (votes) {
    let keys = this.getKeypair()
    let transaction = adamantAPI.newTransaction(constants.Transactions.VOTE)
    transaction = Object.assign({
      asset: {votes: votes},
      recipientId: this.$store.state.address,
      amount: 0
    }, transaction)
    transaction.signature = adamant.transactionSign(transaction, keys)
    this.$store.commit('clean_delegates')
    this.$store.commit('ajax_start')
    this.$http.post(this.getAddressString() + '/api/accounts/delegates', transaction).then(response => {
      if (response.body.success) {
        this.$store.commit('set_last_transaction_status', false)
        // removing an UI waiting state if transaction confirmation run to much time
        window.setTimeout(() => {
          if (!this.$store.state.lastTransactionConfirmed) {
            this.$store.commit('send_error', { msg: this.$t('votes.transaction_confirm_await') })
          }
          this.$store.commit('ajax_end')
          this.getDelegatesWithVotes()
        }, 15000)
        this.checkUnconfirmedTransactions()
      } else {
        this.$store.commit('send_error', { msg: `${this.$t('error')}: ${response.body.error}` })
        this.getDelegatesWithVotes()
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
