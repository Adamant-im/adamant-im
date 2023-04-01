import { delay } from 'redux-saga/effects'
import { showSnackbar } from './actions'

export function* snackbarSaga(action: ReturnType<typeof showSnackbar>) {
  console.log('snackbarSaga executed', action)
  yield delay(5000)
  console.log('snackbarSaga ended delay 5000')
}
