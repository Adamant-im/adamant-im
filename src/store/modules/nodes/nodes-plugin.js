import { nodes } from '@/lib/nodes'

export default (store) => {
  // initial nodes state
  for (const [nodeType, client] of Object.entries(nodes)) {
    client.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType }))

    client.onStatusUpdate((status) => {
      store.commit('nodes/status', { status, nodeType })
    })
  }
  store.commit('nodes/useFastest', nodes.adm.useFastest)

  store.subscribe((mutation) => {
    const { type, payload } = mutation

    if (type === 'nodes/useFastest') {
      nodes.adm.setUseFastest(!!mutation.payload)
    }

    if (type === 'nodes/toggle') {
      const newStatus = nodes.adm.toggleNode(payload.url, payload.active)

      if (newStatus) {
        store.commit('nodes/status', { status: newStatus, nodeType: 'adm' })
      }
    }
  })
}
