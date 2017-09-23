var config = require('../config.json')
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
}
export default install

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(install)
  if (install.installed) {
    install.installed = false
  }
}

