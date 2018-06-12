const config = require('../../../config.json')

export default {
  serverList: config.server.adm.map(obj => ({ ...obj, online: true })),
  checker: null
}
