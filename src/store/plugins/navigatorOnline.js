export default (store) => {
  window.addEventListener('online', handleEvent)
  window.addEventListener('offline', handleEvent)

  function handleEvent(event) {
    store.commit('setIsOnline', event.type === 'online')
  }
}
