import { useI18n } from 'vue-i18n'
import { EPOCH } from '@/lib/constants'

export function useFormattedDate() {
  const { t } = useI18n()

  const getTime = (date: Date) => {
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

  const formatDate = (timestamp: string | number) => {
    timestamp = parseInt(String(timestamp)) as number
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

    let options: Record<string, unknown> = { weekday: 'short' }
    if (Date.now() - timestamp > 4 * 3600 * 24 * 1000) {
      options = { day: 'numeric', month: 'short' }
    }

    if (startToday.getFullYear() !== date.getFullYear()) {
      options.year = 'numeric'
    }

    return date.toLocaleDateString(t('region'), options) + ', ' + getTime(date)
  }

  return {
    formatDate
  }
}
