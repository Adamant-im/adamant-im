import dayjs from 'dayjs'
import i18n from '@/i18n'

export default (timestamp) => {
  const date = dayjs(timestamp)

  const diffDays = dayjs().diff(date, 'day')

  if (diffDays < 1) {
    return date.format(`[${i18n.t('chats.date_today')}], HH:mm`)
  } else if (diffDays < 2) {
    return date.format(`[${i18n.t('chats.date_yesterday')}], HH:mm`)
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
