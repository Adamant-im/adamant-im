import { adm } from '@/lib/nodes/adm'
import { eth } from '@/lib/nodes/eth'

export default (store) => {
  // initial nodes state
  adm.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType: 'adm' }))
  eth.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType: 'eth' }))

  store.subscribe((mutation) => {
    if (mutation.type === 'nodes/useFastest') {
      adm.useFastest = !!mutation.payload
    }

    if (mutation.type === 'nodes/toggle') {
      adm.toggleNode(mutation.payload.url, mutation.payload.active)
    }
  })

  adm.onStatusUpdate((status) => {
    store.commit('nodes/status', { status, nodeType: 'adm' })
  })
  eth.onStatusUpdate((status) => {
    store.commit('nodes/status', { status, nodeType: 'eth' })
  })
}
