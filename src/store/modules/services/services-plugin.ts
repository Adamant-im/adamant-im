import { services } from '@/lib/nodes/services'
import { Store } from 'vuex'
import { AvailableService, ServicesState } from '@/store/modules/services/types.ts'

export default (store: Store<ServicesState>) => {
  for (const [serviceType, client] of Object.entries(services)) {
    client
      .getNodes()
      .forEach((status) => store.commit('servicesModule/status', { status, serviceType }))

    client.onStatusUpdate((status) => {
      store.commit('servicesModule/status', { status, serviceType })
    })
  }
  store.commit('servicesModule/useFastestService', services.rate.useFastest)

  store.subscribe((mutation) => {
    const { type, payload } = mutation

    if (type === 'servicesModule/useFastestService') {
      services.rate.setUseFastest(!!payload)
    }

    if (type === 'servicesModule/toggle') {
      const selectedNodeType = payload.type as AvailableService
      const newStatus = services[selectedNodeType].toggleNode(payload.url, payload.active)

      if (newStatus) {
        store.commit('servicesModule/status', { status: newStatus, serviceType: selectedNodeType })
      }
    }
  })
}
