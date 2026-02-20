import { defineStore } from 'pinia'
import { ref } from 'vue'

export type LogLevel = 'debug' | 'info' | 'warn' | 'public'

export const useLoggerStore = defineStore(
  'logger',
  () => {
    const defaultLevelAll: LogLevel[] = ['debug', 'info', 'warn', 'public']
    const defaultLevelCurrent: LogLevel = 'public'

    const levelAll = ref<LogLevel[]>([...defaultLevelAll])
    const levelCurrent = ref<LogLevel>(defaultLevelCurrent)

    const setLevel = (level: LogLevel) => {
      levelCurrent.value = level
    }

    const $reset = () => {
      levelAll.value = [...defaultLevelAll]
      levelCurrent.value = defaultLevelCurrent
    }

    return {
      levelAll,
      levelCurrent,
      setLevel,
      $reset
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
