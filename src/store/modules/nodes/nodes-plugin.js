import admClient from '@/lib/nodes/adm/AdmClient'

export default store => {
  // initial nodes state
  admClient.getNodes().forEach(node => store.commit('nodes/status', node))

  admClient.updateStatus()

  store.subscribe(mutation => {
    if (mutation.type === 'nodes/useFastest') {
      admClient.useFastest = !!mutation.payload
    }

    if (mutation.type === 'nodes/toggle') {
      admClient.toggleNode(mutation.payload.url, mutation.payload.active)
    }
  })

  admClient.onStatusUpdate(status => {
    store.commit('nodes/status', status)
  })
}
