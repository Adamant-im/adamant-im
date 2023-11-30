/**
 * Custom error to indicate that the endpoint is not available
 */
export class NodeOfflineError extends Error {
  code = 'NODE_OFFLINE'

  constructor() {
    super('Node is offline')

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NodeOfflineError)
    }
  }
}

export function isNodeOfflineError(error: Error): error is NodeOfflineError {
  return (error as NodeOfflineError).code === 'NODE_OFFLINE'
}
