export const ErrorCodes = {
  TX_ALREADY_IN_PROCESS: 'TX_ALREADY_IN_PROCESS'
}

export class DuplicatedNonceError extends Error {
  constructor(message, errorCode) {
    super(message)

    this.name = 'DuplicatedNonceError'
    this.errorCode = errorCode
  }
}
