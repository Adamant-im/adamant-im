<template>
  <div class="chats">
    <md-layout md-align="center" md-gutter="16">
      <md-layout md-flex="66" sm-flex="90">

          <md-input-container>
              <label>{{ $t('login.password_label') }}</label>
              <md-textarea v-model="passPhrase"></md-textarea>
          </md-input-container>
          <md-layout md-align="center" md-gutter="16">
          <md-button class="md-raised md-primary" v-on:click="logme">{{ $t('login.login_button') }}</md-button>
              <md-button class="md-raised md-secondary" v-on:click="showCreate = true">{{ $t('login.new_button') }}</md-button>
          </md-layout>
      </md-layout>
    </md-layout>
  </div>
</template>

<script>
export default {
  name: 'login',
  methods: {
    logme () {
      console.log(this.passPhrase)
      this.getAccountByPassPhrase(this.passPhrase, function (context) {
        this.$store.commit('save_passphrase', {'passPhrase': this.passPhrase})
        this.$root._router.push('/home/')
      })
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
      passPhrase: '',
      language: 'en',
      showCreate: false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
