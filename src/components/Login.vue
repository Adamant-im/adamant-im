<template>
  <div class="login">
    <md-layout md-align="center" md-gutter="16">
      <md-layout md-flex="66" sm-flex="90">

          <md-input-container>
              <label>{{ $t('login.password_label') }}</label>
              <md-textarea></md-textarea>
          </md-input-container>
          <md-layout md-align="center" md-gutter="16">
          <md-button class="md-raised md-primary" v-on:click="logme">{{ $t('login.login_button') }}</md-button>
              <md-button class="md-raised md-secondary" v-on:click="showCreate = true">{{ $t('login.new_button') }}</md-button>
          </md-layout>
      </md-layout>
    </md-layout>
      <md-layout v-if="showCreate" md-align="center" md-gutter="16">
          <md-layout md-flex="66" sm-flex="90">
              <md-input-container>
                  <label>{{ $t('login.new_password_label') }}</label>
                  <md-textarea v-bind:value="yourPassPhrase" readonly></md-textarea>
              </md-input-container>

          </md-layout>
      </md-layout>
      <md-layout md-align="center" md-gutter="16">
          <md-layout md-flex="66" sm-flex="90">
              <div class="field-group">

              <md-input-container>
                  <md-icon>g_translate</md-icon>
                  <label for="language">{{ $t('login.language_label') }}</label>
                  <md-select name="language" id="language" v-model="language">
                      <md-option  v-for="(language, code) in languageList" :value="code">{{ language.title }}</md-option>
                  </md-select>
              </md-input-container>
              </div>
          </md-layout>
      </md-layout>
  </div>
</template>

<script>
export default {
  name: 'login',
  methods: {
    logme () {
      this.$store.commit('login', {'address': 'U333', 'passPhrase': 'blabla'})
    }
  },
  computed: {
    languageList: function () {
      var messages = require('../i18n').default
      console.log(messages)
      return messages
    },
    yourPassPhrase: function () {
      var Mnemonic = require('bitcore-mnemonic')
      return new Mnemonic(Mnemonic.Words.ENGLISH).toString()
    }
  },
  watch: {
    'language' (to, from) {
      this.$i18n.locale = to
    }
  },
  data () {
    return {
      language: 'en',
      showCreate: false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
