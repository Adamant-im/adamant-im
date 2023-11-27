import { createI18n } from 'vue-i18n'

import en from '@/locales/en'
import ru from '@/locales/ru'

/**
 * Mockup i18n helper.
 */
export default function mockupI18n() {
  return createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    // fallbackRoot: true,
    silentTranslationWarn: true, // @todo Replace with fallbackRoot: true after updating vue-i18n
    messages: {
      en,
      ru
    }
  })
}
