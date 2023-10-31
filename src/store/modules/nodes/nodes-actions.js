import { adm } from '@/lib/nodes/adm'
import { eth } from '@/lib/nodes/eth'

export default {
  restore({ state }) {
    const nodes = Object.values(state.adm)

    nodes.forEach((node) => adm.toggleNode(node.url, node.active))
  },

  updateStatus() {
    adm.checkHealth()
    eth.checkHealth()
  },

  toggle(context, payload) {
    context.commit('toggle', payload)
  },

  setUseFastest(context, payload) {
    context.commit('useFastest', payload)
  }
}
