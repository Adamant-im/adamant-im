import { i18n } from '@/i18n'

export default (to, from, next) => {
  if (Object.prototype.hasOwnProperty.call(to.meta, 'title')) {
    document.title = to.meta.title
  } else {
    document.title = i18n.global.t('app_title')
  }

  next()
}
