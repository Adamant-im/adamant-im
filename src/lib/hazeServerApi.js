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
      }
    }, response => {
      // error callback
    })
  }
  Vue.prototype.getAccountByPassPhrase = function (passPhrase, callback) {
    var publicKey = this.getPublicKeyFromPassPhrase(passPhrase)
    this.getAccountByPublicKey(publicKey, callback)
  }
}

export default install

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(install)
  if (install.installed) {
    install.installed = false
  }
}

