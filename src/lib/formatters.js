import { EPOCH } from './constants'
import { useI18n } from 'vue-i18n'

function getTime(date) {
  const hours = date.getHours()
  let time = ''
  if (hours < 10) {
    time = '0' + hours
  } else {
    time = '' + hours
  }
  time = time + ':'
  const minutes = date.getMinutes()
  if (minutes < 10) {
    time = time + '0' + minutes
  } else {
    time = time + '' + minutes
  }
  return time
}

export function formatDate(timestamp) {
  const { t } = useI18n()

  timestamp = parseInt(timestamp)
  // That's for the ADM timestamps, which use EPOCH as a base.
  // Other cryptos use normal timestamps
  if (timestamp < EPOCH) {
    timestamp = timestamp * 1000 + EPOCH
  }

  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)

  const date = new Date(timestamp)
  if (date.getTime() > startToday.getTime()) {
    return t('chats.date_today') + ', ' + getTime(date)
  }

  const startYesterday = new Date(startToday.getTime() - 86400000)
  if (date.getTime() > startYesterday.getTime()) {
    return t('chats.date_yesterday') + ', ' + getTime(date)
  }

  let options = { weekday: 'short' }
  if (Date.now() - timestamp > 4 * 3600 * 24 * 1000) {
    options = { day: 'numeric', month: 'short' }
  }

  if (startToday.getFullYear() !== date.getFullYear()) {
    options.year = 'numeric'
  }

  return date.toLocaleDateString(t('region'), options) + ', ' + getTime(date)
}

const plugin = {
  install(app) {
    app.config.globalProperties.$formatDate = formatDate
  }
}

export default plugin
