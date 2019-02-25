import Vue from 'vue'
import VueI18n from 'vue-i18n'

import de from './i18n/de'
import en from './i18n/en'
import fr from './i18n/fr'
import it from './i18n/it'
import ru from './i18n/ru'

Vue.use(VueI18n)

function loadLocaleMessages () {
  return {
    de, en, fr, it, ru
  }
}

// https://kazupon.github.io/vue-i18n/guide/pluralization.html#custom-pluralization
/**
 * @param choice {number} a choice index given by the input to $tc: `$tc('path.to.rule', choiceIndex)`
 * @param choicesLength {number} an overall amount of available choices
 * @returns a final choice index to select plural word by
**/
VueI18n.prototype.getChoiceIndex = function (choice, choicesLength) {
  // this === VueI18n instance, so the locale property also exists here
  if (this.locale !== 'ru') {
    // proceed to the default implementation
  }

  if (choice === 0) {
    return 0
  }

  const teen = choice > 10 && choice < 20
  const endsWithOne = choice % 10 === 1

  if (!teen && endsWithOne) {
    return 1
  }

  if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
    return 2
  }

  return (choicesLength < 4) ? 2 : 3
}

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: loadLocaleMessages(),
  fallbackRoot: true,
  pluralizationRules: {
    /**
     * @param choice {number} a choice index given by the input to $tc:
     *   `$tc('path.to.rule', choiceIndex)`
     * @param choicesLength {number} an overall amount of available choices
     * @returns a final choice index to select plural word by
     */
    'ru': function (choice, choicesLength) {
      // this === VueI18n instance, so the locale property also exists here
      if (choice === 0) {
        return 0
      }
      const teen = choice > 10 && choice < 20
      const endsWithOne = choice % 10 === 1
      if (choicesLength < 4) {
        return (!teen && endsWithOne) ? 1 : 2
      }
      if (!teen && endsWithOne) {
        return 1
      }
      if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
        return 2
      }
      return (choicesLength < 4) ? 2 : 3
    }
  },
  silentTranslationWarn: true
})
