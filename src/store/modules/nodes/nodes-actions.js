import apiClient from '../../../lib/adamant-api-client'

export default {
  restore ({ state }) {
    const nodes = Object.values(state.list)

    nodes.forEach(node => apiClient.toggleNode(node.url, node.active))
  },

  updateStatus () {
    apiClient.updateStatus()
  },

  toggle (context, payload) {
    context.commit('toggle', payload)
  },

  setUseFastest (context, payload) {
    context.commit('useFastest', payload)
  }
}
