import { useSnackbarStore } from '@/pinia/stores/snackbar/snackbar'
import { fetchTodoFailed, fetchTodoSucceeded } from '@/pinia/stores/todo/actions'
import { call, put } from 'redux-saga/effects'

export function * fetchTodoSaga (action) {
  const { payload } = action

  const snackbar = useSnackbarStore()
  console.log('you can select another store inside saga (a.k.a select() effect)', snackbar.$state)

  try {
    const response = yield call(
      fetch,
      `https://jsonplaceholder.typicode.com/todos/${payload.id}`
    )
    const data = yield call([response, 'json'])

    yield put(fetchTodoSucceeded(data))
  } catch (error) {
    yield put(fetchTodoFailed(error))
  }
}
