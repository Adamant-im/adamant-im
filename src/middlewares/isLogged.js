import { navigateByURI } from '@/router/navigationGuard'
import store from '@/store'

export default (to, from, next) => {
  if (to.name === 'Login' && store.getters.isLogged) {
    navigateByURI(next)
  } else {
    next()
  }
}
