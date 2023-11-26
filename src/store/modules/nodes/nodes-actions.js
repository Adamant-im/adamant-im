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

  setUseFastest(context, payload) {
    context.commit('useFastest', payload)
  }
}
