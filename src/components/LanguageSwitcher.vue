<template>
  <v-menu offset-y>
    <v-btn
      class="ma-0"
      slot="activator"
      flat
    >
      {{ currentLanguageName }}
      <v-icon right>mdi-chevron-down</v-icon>
    </v-btn>
    <v-list>
      <v-list-tile
        v-for="language in languages"
        :key="language.locale"
        @click="onSelect(language.locale)"
      >
        <v-list-tile-title>{{ language.name }}</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  computed: {
    currentLocale: {
      get () {
        return this.$store.state.language.currentLocale
      },
      set (value) {
        this.$store.dispatch('language/changeLocale', value)
      }
    },
    currentLanguageName () {
      const language = this.languages.find(language => language.locale === this.currentLocale)

      return language.name
    }
  },
  data () {
    return {
      // @todo may need to be transferred to i18n
      languages: [
        {
          name: 'العربية',
          locale: 'ar'
        },
        {
          name: 'Deutsch',
          locale: 'de'
        },
        {
          name: 'English',
          locale: 'en'
        },
        {
          name: 'Française',
          locale: 'fr'
        },
        {
          name: 'Русский',
          locale: 'ru'
        }
      ]
    }
  },
  methods: {
    onSelect (locale) {
      this.currentLocale = locale
    }
  }
}
</script>
