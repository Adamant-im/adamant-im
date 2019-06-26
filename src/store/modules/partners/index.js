import mutations from './partner-mutations'
import actions from './partner-actions'
import getters from './partners-getters'
import initialState from './partners-state'

export default {
  namespaced: true,
  state: initialState(),
  actions,
  mutations,
  getters
}
