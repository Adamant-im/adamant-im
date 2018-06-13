const config = require('../../../config.json')
const HealthChecker = require('../../../lib/healthCheck').default

export default {
  initCheckers (state, requester) {
    Object.keys(config.server).forEach(key => {
      state[key] = {
        serverList: config.server[key].map(obj => ({ ...obj, online: true })),
        checker: new HealthChecker({
          requester,
          urls: config.server[key],
          onStatusChange: urls => { state[key].serverList = urls }
        })
      }
    })
  }
}
