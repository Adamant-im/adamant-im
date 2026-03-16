type MessageKeypressParams = {
  keyCode: number
  sendOnEnter: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

export type MessageSubmitAction = 'none' | 'send' | 'linefeed'

export const getMessageSubmitAction = ({
  keyCode,
  sendOnEnter,
  ctrlKey,
  altKey,
  metaKey,
  shiftKey
}: MessageKeypressParams): MessageSubmitAction => {
  // On some devices keyCode for CTRL+ENTER is 10
  // https://bugs.chromium.org/p/chromium/issues/detail?id=79407
  if (keyCode !== 13 && keyCode !== 10) {
    return 'none'
  }

  if (sendOnEnter) {
    if (ctrlKey || altKey || metaKey) {
      return 'linefeed'
    }

    return shiftKey ? 'none' : 'send'
  }

  return ctrlKey || shiftKey || altKey || metaKey ? 'send' : 'none'
}
