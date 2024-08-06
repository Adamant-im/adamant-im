import { services } from '@/lib/nodes/services'
import { Plugin } from 'vuex'
import { AvailableService, ServicesState } from '@/store/modules/services/types'
import { NODE_LABELS } from '@/lib/nodes/constants'

const servicesPlugin: Plugin<ServicesState> = (store) => {
  for (const [serviceType, client] of Object.entries(services)) {
    client.getNodes().forEach((status) => store.commit('services/status', { status, serviceType }))

    client.onStatusUpdate((status) => {
      store.commit('services/status', { status, serviceType })
    })
  }
  store.commit('services/useFastestService', services[NODE_LABELS.RatesInfo].useFastest)

  store.subscribe((mutation) => {
    const { type, payload } = mutation

    if (type === 'services/useFastestService') {
      services[NODE_LABELS.RatesInfo].setUseFastest(!!payload)
    }

    if (type === 'services/toggle') {
      const selectedNodeType = payload.type as AvailableService
      const newStatus = services[selectedNodeType].toggleNode(payload.url, payload.active)

      if (newStatus) {
        store.commit('services/status', { status: newStatus, serviceType: selectedNodeType })
      }
    }
  })
}

export default servicesPlugin
