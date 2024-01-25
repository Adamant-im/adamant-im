import { nodes } from '@/lib/nodes'

export default (store) => {
  // initial nodes state
  for (const [nodeType, client] of Object.entries(nodes)) {
    client.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType }))

    client.onStatusUpdate((status) => {
      store.commit('nodes/status', { status, nodeType })
    })
  }
  store.commit('nodes/useFastestAdmNode', nodes.adm.useFastest)
  // todo: useFaster for coin nodes

  store.subscribe((mutation) => {
    const { type, payload } = mutation

    if (type === 'nodes/useFastestAdmNode') {
      nodes.adm.setUseFastest(!!payload)
    }

    // todo mutation for coin nodes

    if (type === 'nodes/toggle') {
      const selectedNodeType = payload.type
      const newStatus = nodes[selectedNodeType].toggleNode(payload.url, payload.active)

      if (newStatus) {
        store.commit('nodes/status', { status: newStatus, nodeType: selectedNodeType })
      }
    }
  })
}
