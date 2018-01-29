<template>
  <div class="home">
      <md-layout md-align="center" md-gutter="16">
      <md-list class="md-double-line">
          <md-list-item v-on:click="copy" v-clipboard="this.$store.state.address" @success="copySuccess" :title="$t('home.your_address_tooltip')">
              <md-avatar class="md-avatar-icon">
                  <md-icon>account_circle</md-icon>
              </md-avatar>

              <div class="md-list-text-container">
                  <span>{{ $t('home.your_address') }} </span>
                  <p> {{ this.$store.state.address }}</p>
              </div>
          </md-list-item>

              <md-list-item  v-on:click="$router.push('/transactions/')" :title="$t('home.your_balance_tooltip')">
                  <md-avatar class="md-avatar-icon">
                      <md-icon>account_balance_wallet</md-icon>
                  </md-avatar>
              <div class="md-list-text-container">
                  <span>{{ $t('home.your_balance') }}  </span>
                  <p> <span v-html="this.$store.state.balance"></span> ADM</p>
              </div>

          </md-list-item>
          <md-list-item v-on:click="$router.push('/transfer/')" :title="$t('home.send_btn_tooltip')">
              <md-avatar class="md-avatar-icon">
                  <md-icon>send</md-icon>
              </md-avatar>
              <div class="md-list-text-container">
                  <span>{{ $t('home.send_btn') }}</span>
                  <p></p>
              </div>

          </md-list-item>
          <md-list-item :href="icoAddress" target="_blank" :title="$t('home.invest_btn_tooltip')">

              <md-avatar class="md-avatar-icon">
                  <md-icon>monetization_on</md-icon>
              </md-avatar>

              <div class="md-list-text-container">
                  <span>{{ $t('home.invest_btn') }} </span>
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
    icoAddress: function () {
      if (this.$i18n.locale === 'ru') {
        return 'https://adamant.im/ru-ico/?wallet=' + this.$store.state.address
      }
      return 'https://adamant.im/ico/?wallet=' + this.$store.state.address
    },
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
