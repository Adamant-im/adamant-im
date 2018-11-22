<template>
  <v-menu offset-y>
    <v-btn
      class="ma-0"
      slot="activator"
      flat
    >
      {{ currentLanguage }}
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
import i18n from '../i18n'

export default {
  mounted () {
    this.currentLanguage = this.$i18n.locale
  },
  computed: {
    languages () {
      return i18n.messages
    },
    currentLanguage: {
      get () {
        const languageCode = Object.keys(this.languages)
          .find(code => code === this.$i18n.locale)

        return this.languages[languageCode].title
      },
      set (languageCode) {
        this.$i18n.locale = languageCode
        this.$store.commit('change_lang', languageCode)
      }
    }
  },
  methods: {
    onSelect (languageCode) {
      this.currentLanguage = languageCode
    }
  }
}
</script>
