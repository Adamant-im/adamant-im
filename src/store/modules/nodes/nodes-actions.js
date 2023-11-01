import { adm } from '@/lib/nodes/adm'
import { eth } from '@/lib/nodes/eth'
import { btc } from '@/lib/nodes/btc'
import { doge } from '@/lib/nodes/doge'
import { dash } from '@/lib/nodes/dash'

export default {
  restore({ state }) {
    const nodes = Object.values(state.adm)

    nodes.forEach((node) => adm.toggleNode(node.url, node.active))
  },

  updateStatus() {
    adm.checkHealth()
    eth.checkHealth()
    btc.checkHealth()
    doge.checkHealth()
    dash.checkHealth()
  },

  toggle(context, payload) {
    context.commit('toggle', payload)
  },

  setUseFastest(context, payload) {
    context.commit('useFastest', payload)
  }
}
