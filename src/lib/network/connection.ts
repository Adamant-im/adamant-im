import { logger } from '@/utils/devTools/logger'

export type NavigatorConnection = {
  effectiveType?: string
  rtt?: number
  downlink?: number
  saveData?: boolean
  addEventListener?: (type: 'change', listener: () => void) => void
  removeEventListener?: (type: 'change', listener: () => void) => void
}

const SLOW_CONNECTION_TIMEOUT_MULTIPLIER = 1.5
const DEV_CONNECTION_PROBE_MIN_INTERVAL_MS = 2_000
const DEV_CONNECTION_PROBE_TIMEOUT_MS = 10_000
const DEV_CONNECTION_PROBE_SLOW_DURATION_MS = 250
const NETWORK_INFO_LOW_DOWNLINK_THRESHOLD_MBPS = 1

let lastKnownSlowConnectionState: boolean | null = null
let lastDevProbeAt = 0
let lastDevProbeSlowState: boolean | null = null
let devProbePromise: Promise<void> | null = null
let stopConnectionQualityMonitoringFn: (() => void) | null = null
const connectionStateSubscribers = new Set<() => void>()

function normalizeConnectionType(effectiveType?: string) {
  return effectiveType?.toLowerCase() || ''
}

function isDevConnectionProbeEnabled() {
  return (
    import.meta.env.DEV &&
    !import.meta.env.VITEST &&
    import.meta.env.MODE !== 'test' &&
    typeof window !== 'undefined' &&
    typeof fetch === 'function' &&
    typeof performance !== 'undefined'
  )
}

function runDevConnectionProbe() {
  const startedAt = performance.now()
  const probeUrl = new URL(window.location.href)
  probeUrl.searchParams.set('__adm_connection_probe', `${Date.now()}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEV_CONNECTION_PROBE_TIMEOUT_MS)

  return fetch(probeUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
    signal: controller.signal
  })
    .then((response) => response.arrayBuffer())
    .then(() => {
      const durationMs = performance.now() - startedAt
      lastDevProbeSlowState = durationMs >= DEV_CONNECTION_PROBE_SLOW_DURATION_MS
    })
    .catch(() => {
      // Keep probe state unknown on errors to avoid false slow positives.
      lastDevProbeSlowState = null
    })
    .finally(() => {
      clearTimeout(timeoutId)
      lastDevProbeAt = Date.now()
      connectionStateSubscribers.forEach((subscriber) => subscriber())
    })
}

function scheduleDevConnectionProbe() {
  if (!isDevConnectionProbeEnabled()) {
    return
  }

  if (devProbePromise) {
    return
  }

  const now = Date.now()
  if (now - lastDevProbeAt < DEV_CONNECTION_PROBE_MIN_INTERVAL_MS) {
    return
  }

  devProbePromise = runDevConnectionProbe().finally(() => {
    devProbePromise = null
  })
}

function logConnectionTransition(isSlowConnection: boolean) {
  if (lastKnownSlowConnectionState === null) {
    lastKnownSlowConnectionState = isSlowConnection

    if (isSlowConnection) {
      logger.log(
        'network/connection',
        'public',
        'Potentially slow connection detected. Increasing network timeouts by x1.5.'
      )
    }

    return
  }

  if (lastKnownSlowConnectionState === isSlowConnection) {
    return
  }

  lastKnownSlowConnectionState = isSlowConnection

  if (isSlowConnection) {
    logger.log(
      'network/connection',
      'public',
      'Potentially slow connection detected. Increasing network timeouts by x1.5.'
    )
    return
  }

  logger.log(
    'network/connection',
    'public',
    'Connection quality restored. Returning network timeouts to defaults.'
  )
}

export function isPotentiallySlowConnection(connection?: NavigatorConnection | null) {
  const isRuntimeConnectionCheck = typeof connection === 'undefined'
  const currentConnection =
    connection ??
    (globalThis.navigator as unknown as { connection?: NavigatorConnection } | undefined)
      ?.connection ??
    null

  if (!currentConnection) {
    if (isRuntimeConnectionCheck) {
      scheduleDevConnectionProbe()
      const isSlowByProbe = lastDevProbeSlowState === true
      logConnectionTransition(isSlowByProbe)
      return isSlowByProbe
    }

    return false
  }

  const effectiveType = normalizeConnectionType(currentConnection.effectiveType)
  const isSlowNetworkType =
    effectiveType.includes('slow-2g') ||
    effectiveType.includes('2g') ||
    effectiveType.includes('3g')
  const isDataSaverEnabled = !!currentConnection.saveData
  const hasHighRtt = Number.isFinite(currentConnection.rtt) && Number(currentConnection.rtt) >= 350
  const hasLowDownlink =
    Number.isFinite(currentConnection.downlink) &&
    Number(currentConnection.downlink) > 0 &&
    Number(currentConnection.downlink) <= NETWORK_INFO_LOW_DOWNLINK_THRESHOLD_MBPS

  /**
   * VPN cannot be detected reliably in browser runtime.
   * We approximate potentially slow links by Network Information hints.
   */
  const isSlowConnection = isSlowNetworkType || isDataSaverEnabled || hasHighRtt || hasLowDownlink

  if (isRuntimeConnectionCheck) {
    scheduleDevConnectionProbe()
    const isSlowByProbe = lastDevProbeSlowState === true
    logConnectionTransition(isSlowConnection || isSlowByProbe)
    return isSlowConnection || isSlowByProbe
  }

  return isSlowConnection
}

export function getConnectionAwareTimeout(
  baseTimeoutMs: number,
  connection?: NavigatorConnection | null
) {
  const multiplier = isPotentiallySlowConnection(connection)
    ? SLOW_CONNECTION_TIMEOUT_MULTIPLIER
    : 1

  return Math.round(baseTimeoutMs * multiplier)
}

export function startConnectionQualityMonitoring() {
  if (stopConnectionQualityMonitoringFn) {
    return stopConnectionQualityMonitoringFn
  }

  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return () => {}
  }

  const connection = (navigator as unknown as { connection?: NavigatorConnection } | undefined)
    ?.connection
  const evaluateConnection = () => {
    isPotentiallySlowConnection()
  }

  let intervalId: ReturnType<typeof setInterval> | null = null

  if (isDevConnectionProbeEnabled()) {
    intervalId = setInterval(evaluateConnection, DEV_CONNECTION_PROBE_MIN_INTERVAL_MS)
  }

  if (connection?.addEventListener) {
    connection.addEventListener('change', evaluateConnection)
  }
  connectionStateSubscribers.add(evaluateConnection)

  evaluateConnection()

  stopConnectionQualityMonitoringFn = () => {
    if (connection?.removeEventListener) {
      connection.removeEventListener('change', evaluateConnection)
    }

    if (intervalId) {
      clearInterval(intervalId)
    }

    connectionStateSubscribers.delete(evaluateConnection)
    stopConnectionQualityMonitoringFn = null
  }

  return stopConnectionQualityMonitoringFn
}

export function __resetConnectionQualityStateForTests() {
  stopConnectionQualityMonitoringFn?.()
  stopConnectionQualityMonitoringFn = null
  lastKnownSlowConnectionState = null
  lastDevProbeAt = 0
  lastDevProbeSlowState = null
  devProbePromise = null
}
