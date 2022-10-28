import { fetchTodoSaga } from '@/pinia/sagas/fetchTodoSaga'
import { fetchTodo } from '@/pinia/stores/todo/actions'
import { takeLatest } from 'redux-saga/effects'
import { delaySaga } from './delaySaga'

export function * rootSaga () {
  yield takeLatest('show', delaySaga)
  yield takeLatest(fetchTodo.name, fetchTodoSaga)
}
