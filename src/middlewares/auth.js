import store from '@/store'

export default (to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const isLogged = store.getters.isLogged

    if (isLogged) {
      next()
    } else {
      next({ name: 'Login' })
    }
  } else {
    next()
  }
}
