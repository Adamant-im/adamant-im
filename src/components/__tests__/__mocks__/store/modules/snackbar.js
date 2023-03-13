import { vi } from 'vitest'
import { SNACKBAR_TIMEOUT } from '@/store/modules/snackbar/constants'

export default () => ({
  state: {
    show: false,
    message: '',
    timeout: SNACKBAR_TIMEOUT,
    color: ''
  },
  mutations: {
    changeState: vi.fn(),
    resetOptions: vi.fn()
  },
  actions: {
    show: vi.fn()
  },
  namespaced: true
})
