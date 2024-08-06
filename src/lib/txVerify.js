import { i18n } from '@/i18n'

export function formatSendTxError(error) {
  const formattedError = {}
  formattedError.details = {}
  formattedError.details.status = error.response ? error.response.status : undefined
  formattedError.details.statusText = error.response ? error.response.statusText : undefined
  formattedError.details.error = error.toString()
  formattedError.details.response = error.response

  formattedError.errorMessage = `${i18n.global.t('error')}: `
  if (error.response && error.response.data) {
    const errorData = error.response.data
    if (errorData.error) {
      // Dash-like
      const codeString = errorData.error.code ? `[${errorData.error.code}]` : ''
      const messageString = errorData.error.message ? ` ${errorData.error.message}` : ''
      formattedError.errorCode = errorData.error.code
      formattedError.errorMessage += ` ${codeString}${messageString}`
    } else if (errorData.errors && errorData.errors[0]) {
      // Lisk-like
      formattedError.errorMessage += errorData.errors[0].message
    } else {
      // Unknown response format
      formattedError.errorMessage +=
        typeof errorData === 'object' ? ` ${JSON.stringify(errorData, 0, 2)}` : errorData.toString()
    }
  } else {
    if (error.message) {
      // Doge-like
      formattedError.errorMessage += error.message
    } else {
      // Unknown
      formattedError.errorMessage += error.toString()
    }
  }
  return formattedError
}
