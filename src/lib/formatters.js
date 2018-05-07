function formatAmount (amount) {
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
  var startToday = new Date()
  startToday.setHours(0, 0, 0, 0)
  var date = new Date(parseInt(timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0))
  if (date.getTime() > startToday.getTime()) {
    return this.$t('chats.date_today') + ', ' + getTime(date)
  }
  var startYesterday = new Date(startToday.getTime() - 86400000)
  if (date.getTime() > startYesterday.getTime()) {
    return this.$t('chats.date_yesterday') + ', ' + getTime(date)
  }
  var options = {'weekday': 'short'}
  if ((Date.now() - (parseInt(timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0))) > (4 * 3600 * 24 * 1000)) {
    options = {'day': 'numeric', 'month': 'short'}
  }
  return date.toLocaleDateString(this.$t('region'), options) + ', ' + getTime(date)
}

function install (Vue) {
  Vue.prototype.$formatAmount = formatAmount
  Vue.prototype.$formatDate = formatDate
}

export default install
