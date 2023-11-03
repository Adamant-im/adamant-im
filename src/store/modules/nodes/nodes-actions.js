import { nodes } from '@/lib/nodes'

export default {
  restore({ state }) {
    const admNodes = Object.values(state.adm)

    admNodes.forEach((node) => nodes.adm.toggleNode(node.url, node.active))
  },

  updateStatus() {
    for (const [, client] of Object.entries(nodes)) {
      client.checkHealth()
    }
  },

  toggle(context, payload) {
    context.commit('toggle', payload)
  },

  setUseFastest(context, payload) {
    context.commit('useFastest', payload)
  }
}
