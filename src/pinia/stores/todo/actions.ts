import { STORE_NAME } from '@/pinia/stores/todo/constants'

export function fetchTodo (id) {
  return {
    store: STORE_NAME,
    type: 'fetchTodo',
    payload: {
      id
    }
  }
}

export function fetchTodoSucceeded (data) {
  return {
    store: STORE_NAME,
    type: 'fetchTodoSucceeded',
    payload: {
      data
    }
  }
}

export function fetchTodoFailed (error) {
  return {
    store: STORE_NAME,
    type: fetchTodoFailed.name,
    payload: {
      error
    }
  }
}
