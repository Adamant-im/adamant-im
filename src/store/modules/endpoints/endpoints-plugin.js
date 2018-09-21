import apiClient from '../../../lib/adamant-api-client'

export default store => {
  store.subscribe(mutation => {
    if (mutation.type === 'endpoints/useFastest') {
      apiClient.useFastest = !!mutation.payload
    }

    if (mutation.type === 'endpoints/toggle') {
      apiClient.toggleEndpoint(mutation.payload.url, mutation.payload.disabled)
    }
  })

  apiClient.onStatusUpdate(status => {
    store.commit('endpoints/status', status)
  })
}
