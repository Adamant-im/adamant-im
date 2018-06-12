/*
    Health check wrapper for Vue framework
*/
const config = require('../config.json')
const HealthChecker = require('./healthCheck').default

function install (Vue) {
  // List of checking servers
  let serverList = config.server.adm.map(obj => ({
    ...obj,
    online: true
  }))

  // Health check worker
  let checker = null

  // Returns [{ip, protocol, port, online}]
  Vue.prototype.getServerList = function () {
    return serverList
  }

  // Delayed initialization of Vue-related stuff
  function delayedInit () {
    checker = new HealthChecker({
      requester: window.ep.$http,
      urls: config.server,
      onStatusChange: urls => { serverList = urls }
    })

    if (window.ep.$store.state.healthCheck) {
      // Start health checking
      checker.start()
    }

    // Watch for the option changes
    window.ep.$store.subscribe(mutation => {
      if (mutation.type === 'change_health_check') {
        if (mutation.payload) {
          checker.start()
        } else {
          checker.stop()
        }
      }
    })
  }
  window.setTimeout(delayedInit, 0)
}

export default install
