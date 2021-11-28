/* eslint-disable no-console */
import { register } from 'register-service-worker'

if (process.env.NODE_ENV) {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready (registration) {
      console.log('Service worker: active')
    },
    registered (registration) {
      console.log('Service worker: registered')
    },
    cached (registration) {
      console.log('Service worker: content has been cached for offline use')
    },
    updatefound (registration) {
      console.log('Service worker: new content is downloading')
    },
    updated (registration) {
      console.log('Service worker: new content is available; please refresh')
    },
    offline () {
      console.log('Service worker: no internet connection found, app is running in offline mode')
    },
    error (error) {
      console.error('Service worker: error during registration.', error)
    }
  })
}
