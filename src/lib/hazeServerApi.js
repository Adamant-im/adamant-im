var config = require('../config.json')
var secu = require('./secu.js')

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
  Vue.prototype.getAddressString = function (cached) {
    // TODO: add health check
    if (cached && this.$store.state.connectionString && this.$store.state.connectionString !== 'undefined' && this.$store.state.connectionString !== undefined) {
      return this.$store.state.connectionString
    }
    var index = Math.floor(Math.random() * config.server.length)
    if (!config.server[index].protocol) {
      config.server[index].protocol = 'http'
    }
    var connectString = config.server[index].protocol + '://' + config.server[index].ip
    if (config.server[index].port) {
      connectString += ':' + config.server[index].port
    }
    this.$store.commit('connect', {'string': connectString})
    return connectString
  }
  Vue.prototype.getPublicKeyFromPassPhrase = function (passPhrase) {
    var hash = secu.createPassPhraseHash(passPhrase)
    var keypair = secu.makeKeypair(hash)
    return keypair.publicKey.toString('hex')
  }
  Vue.prototype.createNewAccount = function (publicKey, callback) {
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
      } else {
        alert(response.body.error)
      }
    }, response => {
      // error callback
    })
  }
  Vue.prototype.getAccountByPublicKey = function (publicKey, callback) {
    this.$http.get(this.getAddressString() + '/api/accounts?publicKey=' + publicKey).then(response => {
      if (response.body.success) {
        response.body.account.balance = response.body.account.balance / 100000000
        response.body.account.unconfirmedBalance = response.body.account.unconfirmedBalance / 100000000
        response.body.account.publicKey = publicKey
        this.$store.commit('login', response.body.account)
        if (callback) {
          callback.call(this)
        }
      } else if (response.body.error === 'Account not found') {
        this.createNewAccount(publicKey, callback)
      }
    }, response => {
      // error callback
    })
  }
  Vue.prototype.getAccountByPassPhrase = function (passPhrase, callback) {
    var publicKey = this.getPublicKeyFromPassPhrase(passPhrase)
    this.getAccountByPublicKey(publicKey, callback)
  }

  Vue.prototype.transferFunds = function (amount, recipient) {
    this.$store.commit('ajax_start')
    if (this.$store.state.passPhrase) {
      var hash = secu.createPassPhraseHash(this.$store.state.passPhrase)
      var keypair = secu.makeKeypair(hash)
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
          this.$root._router.push('/transactions/' + response.body.transactionId + '/')
        }
      } else {
      }
      this.$store.commit('ajax_end')
    },
    response => {
      this.$store.commit('ajax_end_with_error')
    })
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
        var hash = secu.createPassPhraseHash(this.$store.state.passPhrase)
        var keypair = secu.makeKeypair(hash)
        newTransaction.senderId = transaction.senderId
        newTransaction.signature = secu.transactionSign(newTransaction, keypair)
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

  Vue.prototype.getTransactionInfo = function (txid) {
    this.$http.get(this.getAddressString() + '/api/transactions/get?id=' + txid).then(response => {
      if (response.body.success) {
        response.body.transaction.amount = response.body.transaction.amount / 100000000
        this.$store.commit('ajax_end')
        return response.body.transaction
      }
    }, response => {
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

