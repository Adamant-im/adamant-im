import { i18n } from '@/i18n'
import axios from 'axios'

const checkUrl = 'https://ipv4.icanhazip.com'

export default (store) => {
  // window.addEventListener('online', handleEvent)
  // window.addEventListener('offline', handleEvent)

  // async function handleEvent(event) {
  //   if (event.type === 'online') {
  //     store.commit('setIsOnline', !!res)
  //   } else {
  //     store.commit('setIsOnline', false)
  //   }

  setInterval(async () => {
    const res = Boolean(await inetConnectionCheck())
    const storeVal = store.getters['isOnline']
    if (storeVal !== res) {
      store.commit('setIsOnline', res)
      const snackMsg = res ? 'online' : 'offline'
      store.dispatch('snackbar/show', {
        message: i18n.global.t(`connection.${snackMsg}`),
        timeout: 3000
      })
    }
  }, 1000)
}

const inetConnectionCheck = async () => {
  try {
    const res = await axios.get(`${checkUrl}`, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0'
      }
    })
    return res.status >= 200 && res.status < 300
  } catch (err) {
    if (err.code === 'ERR_NETWORK') return false
  }
}
