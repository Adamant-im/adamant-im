import { useLoggerStore } from '@/lib/logger-store'

export const LEVEL_PRIORITY = {
  debug: 3,
  info: 2,
  warn: 1,
  public: 0
} as const

const shouldLog = (requestedLevel: keyof typeof LEVEL_PRIORITY): boolean => {
  const loggerStore = useLoggerStore()

  return LEVEL_PRIORITY[requestedLevel] <= LEVEL_PRIORITY[loggerStore.levelCurrent]
}

export const logger = {
  log(component: string, level: string, ...args: unknown[]) {
    const caseInsensitive = level.toLowerCase() as keyof typeof LEVEL_PRIORITY
    if (!shouldLog(caseInsensitive)) return

    const consoleMethod = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      public: console.log
    }[caseInsensitive]

    consoleMethod(`[${component}]`, `| ${caseInsensitive} |`, ...args)
  }
}
