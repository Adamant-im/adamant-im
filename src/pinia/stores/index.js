import { useSnackbarStore } from '@/pinia/stores/snackbar/snackbar'
import { useTodoStore } from '@/pinia/stores/todo'

export const getStores = () => ({
  snackbar: useSnackbarStore(),
  todo: useTodoStore()
})
