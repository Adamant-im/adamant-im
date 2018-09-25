import apiClient from '../../../lib/adamant-api-client'

export default store => {
  store.subscribe(mutation => {
    if (mutation.type === 'nodes/useFastest') {
      apiClient.useFastest = !!mutation.payload
    }

    if (mutation.type === 'nodes/toggle') {
      apiClient.toggleNode(mutation.payload.url, mutation.payload.active)
    }
  })

  apiClient.onStatusUpdate(status => {
    store.commit('nodes/status', status)
  })
}
