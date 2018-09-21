import apiClient from '../../../lib/adamant-api-client'

export default {
  afterLogin: {
    root: true,
    handler (context) {
      context.dispatch('updateStatus')
    }
  },

  rehydrate: {
    root: true,
    handler (context) {
      context.dispatch('updateStatus')
    }
  },

  updateStatus () {
    apiClient.updateStatus()
  }
}