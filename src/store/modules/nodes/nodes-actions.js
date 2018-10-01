import apiClient from '../../../lib/adamant-api-client'

export default {
  updateStatus () {
    apiClient.updateStatus()
  },

  toggle (context, payload) {
    context.commit('toggle', payload)
  },

  setUseFastest (context, url) {
    context.commit('useFastest', url)
  }
}
