/*
    Health check support for Vuex
*/
import actions from './actions'
import mutations from './mutations'
import getters from './getters'

/* State structure explained:
{
  adm: {
    serverList: [{
      ip,
      protocol,
      port,
      online
    }],
    checker: HealthChecker object
  },
  ...
}
*/

export default {
  namespaced: true,
  state: {},
  actions,
  mutations,
  getters
}
