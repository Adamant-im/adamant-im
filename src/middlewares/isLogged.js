import store from '@/store'

export default (to, from, next) => {
  if (to.name === 'Login' && store.getters.isLogged) {
    next({ name: 'Chats' })
  } else {
    next()
  }
}
