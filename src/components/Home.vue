<template>
  <div class="home">
      <md-layout md-align="center" md-gutter="16">
      <md-list class="md-double-line">
          <md-list-item v-on:click="copy" v-clipboard="this.$store.state.address" @success="copySuccess">
              <md-avatar class="md-avatar-icon">
                  <md-icon>account_circle</md-icon>
              </md-avatar>

              <div class="md-list-text-container">
                  <span>{{ $t('home.your_address') }} </span>
                  <p> {{ this.$store.state.address }}</p>
              </div>
          </md-list-item>

              <md-list-item  v-on:click="$router.push('/transactions/')">
                  <md-avatar class="md-avatar-icon">
                      <md-icon>account_balance_wallet</md-icon>
                  </md-avatar>
              <div class="md-list-text-container">
                  <span>{{ $t('home.your_balance') }}  </span>
                  <p> <span v-html="this.$store.state.balance"></span> ADM</p>
              </div>

          </md-list-item>
          <md-list-item v-on:click="$router.push('/transfer/')">
              <md-avatar class="md-avatar-icon">
                  <md-icon>send</md-icon>
              </md-avatar>
              <div class="md-list-text-container">
                  <span>{{ $t('home.send_btn') }}</span>
                  <p></p>
              </div>

          </md-list-item>
      </md-list>
      </md-layout>
      <md-snackbar md-position="bottom center" md-accent ref="homeSnackbar" md-duration="2000">
          <span>{{ $t('home.copied') }}</span>
      </md-snackbar>
  </div>
</template>

<script>
export default {
  name: 'home',
  methods: {
    copySuccess (e) {
      this.$refs.homeSnackbar.open()
    },
    copy () {
    }
  },
  computed: {
    isNewUser: function () {
      return this.$store.state.is_new_account
    },
    languageList: function () {
      var messages = require('../i18n').default
      return messages
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
.home .md-list-text-container p
{
    font-style: italic;
}

</style>
