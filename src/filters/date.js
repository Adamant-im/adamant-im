import dayjs from 'dayjs'
import i18n from '@/i18n'
import { isCurrentWeek, isToday, isYesterday } from './helpers'

export default (timestamp) => {
  const date = dayjs(timestamp)

  if (isToday(new Date(timestamp))) {
    return date.format(`[${i18n.t('chats.date_today')}], HH:mm`)
  } else if (isYesterday(new Date(timestamp))) {
    return date.format(`[${i18n.t('chats.date_yesterday')}], HH:mm`)
  } else if (isCurrentWeek(new Date(timestamp))) {
    return date.format('dddd, HH:mm')
  } else {
    const currentYear = (new Date()).getFullYear()
    const messageYear = (new Date(timestamp)).getFullYear()

    if (currentYear === messageYear) {
      return date.format('MMM DD')
    } else {
      return date.format('MMM DD, YYYY')
    }
  }
}
