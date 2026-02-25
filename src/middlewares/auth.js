import store from '@/store'

export default (to) => {
  if (!to.meta.requiresAuth) {
    return true
  }

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const isLogged = store.getters.isLogged

    if (isLogged) {
      return true
    } else {
      return { name: 'Login' }
    }
  }

  return true
}
