import { nodes } from '@/lib/nodes'

export default {
  updateStatus() {
    for (const [, client] of Object.entries(nodes)) {
      client.checkHealth()
    }
  },

  toggle(context, payload) {
    context.commit('toggle', payload)
  },

  setUseFastestAdmNode(context, payload) {
    context.commit('useFastestAdmNode', payload)
  },
  setUseFastestCoinNode(context, payload) {
    context.commit('useFastestCoinNode', payload)
  }
}
