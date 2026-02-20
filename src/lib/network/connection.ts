export type NavigatorConnection = {
  effectiveType?: string
  rtt?: number
  downlink?: number
  saveData?: boolean
}

const SLOW_CONNECTION_TIMEOUT_MULTIPLIER = 1.5

function normalizeConnectionType(effectiveType?: string) {
  return effectiveType?.toLowerCase() || ''
}

export function isPotentiallySlowConnection(connection?: NavigatorConnection | null) {
  const currentConnection =
    connection ??
    (globalThis.navigator as unknown as { connection?: NavigatorConnection } | undefined)
      ?.connection ??
    null

  if (!currentConnection) {
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
    Number.isFinite(currentConnection.downlink) && Number(currentConnection.downlink) <= 1.5

  /**
   * VPN cannot be detected reliably in browser runtime.
   * We approximate potentially slow links by Network Information hints.
   */
  return isSlowNetworkType || isDataSaverEnabled || hasHighRtt || hasLowDownlink
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
