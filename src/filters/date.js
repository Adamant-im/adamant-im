import moment from 'moment'
import i18n from '@/i18n'

export default (timestamp) => {
  const date = moment(timestamp)

  return date.calendar(null, {
    sameDay: i18n.t('chats.date_today'),
    lastDay: i18n.t('chats.date_yesterday'),
    lastWeek: 'ddd',
    sameElse: 'DD.MM.YYYY'
  })
}
