import apiClient from '../../../lib/adamant-api-client'

export default {
  restore (context, payload = { }) {
    context.commit('useFastest', !!payload.useFastest)

    if (payload.list) {
      Object.values(payload.list).forEach(node => {
        context.commit('status', node)
        apiClient.toggleNode(node.url, node.active)
      })
    }
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
