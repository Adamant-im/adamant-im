/*
    Health check wrapper for Vue framework
*/
const config = require('../config.json')
const HealthChecker = require('./healthCheck')

let serverList = config.server.map(obj => ({
  ...obj,
  online: true
}))

function install (Vue) {
  // Returns [{ip, protocol, port, online}]
  Vue.prototype.getServerList = function () {
    return serverList
  }

  // FIXME
  if (window.healthCheck) {
    // Start health checking
    const hc = new HealthChecker({
      requester: Vue.prototype.$http,
      urls: config.servers,
      onStatusChange: urls => { serverList = urls }
    })

    hc.start()
  }
}

export default install
