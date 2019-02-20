import moment from 'moment'
import i18n from '@/i18n'

export default (timestamp) => {
  const date = moment(timestamp)

  return date.calendar(null, {
    sameDay: `[${i18n.t('chats.date_today')}], HH:mm`,
    lastDay: `[${i18n.t('chats.date_yesterday')}], HH:mm`,
    lastWeek: 'ddd, HH:mm',
    sameElse: 'MMM DD, YYYY, HH:mm'
  })
}
