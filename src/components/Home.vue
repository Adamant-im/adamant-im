<template>
  <div class="home">
      <md-layout md-align="center" md-gutter="16">
      <md-list class="md-double-line">
          <md-list-item
            v-for="addr in wallets"
            v-bind:key="addr.system"
            v-on:click="copy"
            v-clipboard="addr.address"
            @success="copySuccess"
            :title="addr.tooltip ? $t(addr.tooltip) : ''"
          >
              <md-avatar class="md-avatar-icon">
                  <md-icon>account_circle</md-icon>
              </md-avatar>

              <div class="md-list-text-container">
                  <span>{{ $t('home.your_address') }} {{ addr.system }}</span>
                  <p> {{ addr.address }}</p>
              </div>

              <div class='md-list-action'>
                <md-icon>content_copy</md-icon>
              </div>
          </md-list-item>

          <md-list-item
            v-for="wallet in wallets"
            v-bind:key="wallet.system"
            v-on:click="goToTransactions(wallet.system)"
            :title="wallet.balanceTooltip ? $t(wallet.balanceTooltip) : ''"
          >
            <md-avatar class="md-avatar-icon">
                <md-icon>account_balance_wallet</md-icon>
            </md-avatar>
            <div class="md-list-text-container">
                <span>{{ $t('home.your_balance') }} {{ wallet.system }}</span>
                <p> <span v-html="wallet.balance"></span> {{ wallet.system }}</p>
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

          <md-list-item :href="freeAdmAddress" target="_blank">

              <md-avatar class="md-avatar-icon">
                  <md-icon>monetization_on</md-icon>
              </md-avatar>

              <div class="md-list-text-container">
                  <span>{{ $t('home.free_adm_btn') }} </span>
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
    },
    goToTransactions (system) {
      if (system === 'ADM') {
        this.$router.push('/transactions/')
      }
    }
  },
  computed: {
    icoAddress: function () {
      if (this.$i18n.locale === 'ru') {
        return 'https://adamant.im/ru-ico/?wallet=' + this.$store.state.address
      }
      return 'https://adamant.im/ico/?wallet=' + this.$store.state.address
    },
    freeAdmAddress () {
      return 'https://adamant.im/free-adm-tokens/?wallet=' + this.$store.state.address
    },
    isNewUser: function () {
      return this.$store.state.is_new_account
    },
    languageList: function () {
      var messages = require('../i18n').default
      return messages
    },
    wallets: function () {
      return [
        {
          system: 'ADM',
          address: this.$store.state.address,
          tooltip: 'home.your_address_tooltip',
          balance: this.$store.state.balance,
          balanceTooltip: ''
        },
        {
          system: 'ETH',
          address: this.$store.state.eth.address,
          balance: this.$store.state.eth.balance
        }
      ]
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
