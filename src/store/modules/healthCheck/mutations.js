const HealthChecker = require('../../../lib/healthCheck').default

export default {
  initChecker (state, requester) {
    state.checker = new HealthChecker({
      requester,
      urls: state.serverList,
      onStatusChange: urls => { state.serverList = urls }
    })
  }
}
