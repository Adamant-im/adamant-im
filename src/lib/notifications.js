/**
 * Notifies a user via browser notification
 *
 * @param {string} title the title of the message
 * @param {object} { text: the body, handler: fn } click handler for notification
 */
function notify (title, opts) {
  let notification

  if (!('Notification' in window)) {
    return
  } else if (Notification.permission === 'granted') {
    notification = createNotification(title, opts)
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission(permission => {
      if (permission === 'granted') {
        notification = createNotification(title, opts)
      }
    })
  }

  if (opts.handler) {
    notification.onclick = opts.handler
  }
}

/**
 * Creates a notification event object
 *
 * @param {string} title the title of the message
 * @param {object} { text: the body, handler: fn } click handler for notification
 * @returns {object} notification object
 */
function createNotification (title, opts) {
  return new Notification(title, {
    body: opts.text || ''
  })
}

export default {
  notify
}
