import { EPOCH, Cryptos } from './constants'

function formatAmount (amount, crypto = Cryptos.ADM) {
  if (crypto !== Cryptos.ADM) return amount // TODO: formatting for other cryptos maybe?

  amount = amount / 100000000
  var e
  if (Math.abs(amount) < 1.0) {
    e = parseInt(amount.toString().split('e-')[1])
    if (e) {
      amount *= Math.pow(10, e - 1)
      amount = '0.' + (new Array(e)).join('0') + amount.toString().substring(2)
    }
  } else {
    e = parseInt(amount.toString().split('+')[1])
    if (e > 20) {
      e -= 20
      amount /= Math.pow(10, e)
      amount += (new Array(e + 1)).join('0')
    }
  }
  return amount
}

function getTime (date) {
  var hours = date.getHours()
  var time = ''
  if (hours < 10) {
    time = '0' + hours
  } else {
    time = '' + hours
  }
  time = time + ':'
  var minutes = date.getMinutes()
  if (minutes < 10) {
    time = time + '0' + minutes
  } else {
    time = time + '' + minutes
  }
  return time
}

function formatDate (timestamp) {
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
    return this.$t('chats.date_today') + ', ' + getTime(date)
  }

  const startYesterday = new Date(startToday.getTime() - 86400000)
  if (date.getTime() > startYesterday.getTime()) {
    return this.$t('chats.date_yesterday') + ', ' + getTime(date)
  }

  let options = {'weekday': 'short'}
  if ((Date.now() - timestamp) > (4 * 3600 * 24 * 1000)) {
    options = {'day': 'numeric', 'month': 'short'}
  }

  if (startToday.getFullYear() !== date.getFullYear()) {
    options.year = 'numeric'
  }

  return date.toLocaleDateString(this.$t('region'), options) + ', ' + getTime(date)
}

function install (Vue) {
  Vue.prototype.$formatAmount = formatAmount
  Vue.prototype.$formatDate = formatDate
}

export default install
