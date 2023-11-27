import adamant from '@/lib/adamant'

/**
 * Determine if a date is today.
 *
 * @param {Date} someDate Instance of Date
 * @returns {boolean}
 */
export const isToday = (someDate) => {
  const today = new Date()

  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  )
}

/**
 * Determine if a date is yesterday.
 *
 * @param {Date} someDate Instance of Date
 * @returns {boolean}
 */
export const isYesterday = (someDate) => {
  const today = new Date()
  const yesterday = new Date(today.setDate(today.getDate() - 1))

  return (
    someDate.getDate() === yesterday.getDate() &&
    someDate.getMonth() === yesterday.getMonth() &&
    someDate.getFullYear() === yesterday.getFullYear()
  )
}

/**
 * Determine if a date is current week.
 *
 * @param {Date} someDate Instance of Date
 * @returns {boolean}
 */
export const isCurrentWeek = (someDate) => {
  const today = new Date()

  for (let i = 1; i <= 7; i++) {
    const first = today.getDate() - today.getDay() + i
    const day = new Date(today.setDate(first))

    if (
      someDate.getDate() === day.getDate() &&
      someDate.getMonth() === day.getMonth() &&
      someDate.getFullYear() === day.getFullYear()
    ) {
      return true
    }
  }

  return false
}
/**
 * Timestamp to timestamp seconds.
 *
 */
export const timestampInSec = (crypto, timestamp) => {
  const timestampInMs = crypto === 'ADM' ? adamant.toTimestamp(timestamp) : timestamp
  return Math.floor(timestampInMs / 1000)
}
