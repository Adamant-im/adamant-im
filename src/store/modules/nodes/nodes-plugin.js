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
    if (mutation.type === 'nodes/useFastest') {
      nodes.adm.setUseFastest(!!mutation.payload)
    }

    if (mutation.type === 'nodes/toggle') {
      nodes.adm.toggleNode(mutation.payload.url, mutation.payload.active)
    }
  })
}
