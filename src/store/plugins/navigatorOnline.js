import { i18n } from '@/i18n'

export default (store) => {
  window.addEventListener('online', handleEvent)
  window.addEventListener('offline', handleEvent)

  function handleEvent(event) {
    store.commit('setIsOnline', event.type === 'online')
    store.dispatch('snackbar/show', {
      message: i18n.global.t(`connection.${event.type}`),
      timeout: 3000
    })
  }
}
