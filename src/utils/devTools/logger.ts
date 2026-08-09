import { getActivePinia } from 'pinia'
import { useLoggerStore } from '@/lib/logger-store'

export const LEVEL_PRIORITY = {
  debug: 3,
  info: 2,
  warn: 1,
  public: 0,
  // Errors are always shown, regardless of the level selected by the user.
  error: 0
} as const

const DEFAULT_LEVEL: keyof typeof LEVEL_PRIORITY = 'public'

const isLogLevel = (level: string): level is keyof typeof LEVEL_PRIORITY => {
  return level in LEVEL_PRIORITY
}

const getCurrentLevel = (): keyof typeof LEVEL_PRIORITY => {
  const pinia = getActivePinia()

  if (!pinia) return DEFAULT_LEVEL

  try {
    return useLoggerStore(pinia).levelCurrent
  } catch {
    return DEFAULT_LEVEL
  }
}

const shouldLog = (requestedLevel: keyof typeof LEVEL_PRIORITY): boolean => {
  const currentLevel = getCurrentLevel()

  return LEVEL_PRIORITY[requestedLevel] <= LEVEL_PRIORITY[currentLevel]
}

function write(component: string, level: string, args: unknown[]) {
  const caseInsensitive = level.toLowerCase()

  if (!isLogLevel(caseInsensitive)) {
    console.warn(
      `[logger]`,
      `| warn |`,
      `Unknown log level "${level}" for component "${component}"`
    )
    return
  }

  if (!shouldLog(caseInsensitive)) return

  const consoleMethod = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    public: console.log
  }[caseInsensitive]

  consoleMethod(`[${component}]`, `| ${caseInsensitive} |`, ...args)
}

/**
 * Level-named helpers are standalone functions, not methods, so that they keep
 * working when the logger is destructured or passed around.
 */
export const logger = {
  log(component: string, level: string, ...args: unknown[]) {
    write(component, level, args)
  },
  debug(component: string, ...args: unknown[]) {
    write(component, 'debug', args)
  },
  info(component: string, ...args: unknown[]) {
    write(component, 'info', args)
  },
  warn(component: string, ...args: unknown[]) {
    write(component, 'warn', args)
  },
  error(component: string, ...args: unknown[]) {
    write(component, 'error', args)
  }
}
