import { navigateByURI } from '@/router/navigationGuard'
import store from '@/store'

export default (to) => {
  if (to.name === 'Login' && store.getters.isLogged) {
    navigateByURI()
    return false
  }

  return true
}
