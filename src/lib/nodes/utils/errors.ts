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

/**
 * Unified error class for all nodes. Must be used in `node.getTransaction()` method.
 */
export class TransactionNotFound extends Error {
  constructor(hash: string, chain: string) {
    super(`${chain}: Transaction ${hash} not found`)
  }
}
