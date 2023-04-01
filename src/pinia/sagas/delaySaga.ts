import { delay, put } from 'redux-saga/effects'

export function * delaySaga () {
  yield put({
    type: 'action1',
    payload: 'payload1'
  })
  console.log('start delay 5000')
  yield delay(5000)
  console.log('end delay end')
  yield put({
    type: 'action2',
    payload: 'payload2'
  })
}
