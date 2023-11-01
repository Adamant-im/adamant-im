import { adm } from '@/lib/nodes/adm'
import { eth } from '@/lib/nodes/eth'
import { btc } from '@/lib/nodes/btc'
import { doge } from '@/lib/nodes/doge'
import { dash } from '@/lib/nodes/dash'

export default (store) => {
  // initial nodes state
  adm.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType: 'adm' }))
  eth.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType: 'eth' }))
  btc.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType: 'btc' }))
  doge.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType: 'doge' }))
  dash.getNodes().forEach((status) => store.commit('nodes/status', { status, nodeType: 'dash' }))

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
  btc.onStatusUpdate((status) => {
    store.commit('nodes/status', { status, nodeType: 'btc' })
  })
  doge.onStatusUpdate((status) => {
    store.commit('nodes/status', { status, nodeType: 'doge' })
  })
  dash.onStatusUpdate((status) => {
    store.commit('nodes/status', { status, nodeType: 'dash' })
  })
}
