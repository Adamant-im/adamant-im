import { STORE_NAME } from '@/pinia/stores/todo/constants'
import { fetchTodo, fetchTodoFailed, fetchTodoSucceeded } from './actions'
import { defineStore } from 'pinia'

export const useTodoStore = defineStore(STORE_NAME, {
  state: () => ({
    status: 'idle', // idle, loading, success, error
    todo: null, // TodoDto || null
    error: null // Error || null
  }),
  actions: {
    [fetchTodo.name] () {
      this.status = 'loading'
      this.todo = null
    },
    [fetchTodoSucceeded.name] (payload) {
      this.status = 'success'
      this.todo = payload.data
    },
    [fetchTodoFailed.name] (payload) {
      this.status = 'error'
      this.error = payload.error
    }
  }
})
