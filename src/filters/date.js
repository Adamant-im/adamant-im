import dayjs from 'dayjs'
import i18n from '@/i18n'

export default (timestamp) => {
  const date = dayjs(timestamp)

  const diffDays = dayjs().diff(date, 'day')

  if (diffDays < 1) {
    return date.format(`[${i18n.t('chats.date_today')}], HH:mm`)
  } else if (diffDays < 2) {
    return date.format(`[${i18n.t('chats.date_yesterday')}], HH:mm`)
  } else if (diffDays <= 7) {
    return date.format('ddd, HH:mm')
  } else {
    return date.format('MMM DD, YYYY, HH:mm')
  }
}
