import { defineStore } from 'pinia'
import { ref } from 'vue'

export type LogLevel = 'debug' | 'info' | 'warn' | 'public'

export const useLoggerStore = defineStore(
  'logger',
  () => {
    const levelAll = ref<LogLevel[]>(['debug', 'info', 'warn', 'public'])
    const levelCurrent = ref<LogLevel>('public')

    const setLevel = (level: LogLevel) => {
      levelCurrent.value = level
    }

    return {
      levelAll,
      levelCurrent,
      setLevel
    }
  },
  {
    persist:
      typeof window !== 'undefined'
        ? {
            storage: window.localStorage,
            pick: ['levelCurrent']
          }
        : false
  }
)
