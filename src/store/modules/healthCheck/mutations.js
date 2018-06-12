const HealthChecker = require('../../../lib/healthCheck').default

export default {
  init (state) {
    window.setTimeout(() => {
      state.checker = new HealthChecker({
        requester: window.ep.$http,
        urls: state.serverList,
        onStatusChange: urls => { state.serverList = urls }
      })
    }, 0)
  }
}
