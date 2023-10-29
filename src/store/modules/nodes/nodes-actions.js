import admClient from '@/lib/nodes/adm/AdmClient'

export default {
  restore ({ state }) {
    const nodes = Object.values(state.list)

    nodes.forEach(node => admClient.toggleNode(node.url, node.active))
  },

  updateStatus () {
    admClient.updateStatus()
  },

  toggle (context, payload) {
    context.commit('toggle', payload)
  },

  setUseFastest (context, payload) {
    context.commit('useFastest', payload)
  }
}
