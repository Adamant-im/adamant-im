import VueI18n from 'vue-i18n'

import en from '@/i18n/en'

/**
 * Mockup i18n helper.
 */
export default function mockupI18n () {
  return new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    // fallbackRoot: true,
    silentTranslationWarn: true, // @todo Replace with fallbackRoot: true after updating vue-i18n
    messages: {
      en
    }
  })
}
