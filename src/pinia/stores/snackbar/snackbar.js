import { SNACKBAR_TIMEOUT } from '@/store/modules/snackbar/constants'
import { defineStore } from 'pinia'

const initialState = {
  open: false,
  message: '',
  timeout: SNACKBAR_TIMEOUT,
  color: ''
}

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    ...initialState
  }),
  actions: {
    show (options) {
      this.message = options.message
      this.color = options.color
      this.timeout = options.timeout

      this.open = true
    },
    changeState (open) {
      this.open = open
    },
    resetOptions () {
      this.message = initialState.message
      this.timeout = initialState.timeout
      this.color = initialState.color
    }
  }
})
