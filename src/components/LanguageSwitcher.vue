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
        v-for="(language, code) in languages"
        :key="code"
        @click="onSelect(code)"
      >
        <v-list-tile-title>{{ language.title }}</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
import i18n from '@/i18n'

export default {
  computed: {
    languages () {
      return i18n.messages
    },
    currentLocale: {
      get () {
        return this.$store.state.languageModule.currentLocale
      },
      set (value) {
        this.$store.dispatch('languageModule/changeLocale', value)
      }
    },
    currentLanguageName () {
      const locale = Object.keys(this.languages)
          .find(code => code === this.currentLocale)

      return this.languages[locale].title
    }
  },
  methods: {
    onSelect (locale) {
      this.currentLocale = locale
    }
  }
}
</script>
