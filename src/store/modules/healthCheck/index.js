/*
    Health check support for Vuex
*/
import actions from './actions'
import mutations from './mutations'
import getters from './getters'
import state from './state'

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
}
