<template>
  <!--TODO: absolute paths must be relative again-->
  <div class="home">
      <md-layout md-align="center" md-gutter="16">
      <md-list class="md-double-line">
          <md-list-item
            v-for="addr in wallets"
            :key="'addr_' + addr.system"
            @click="copy"
            v-clipboard="addr.address"
            @success="copySuccess"
            :title="addr.tooltip ? $t(addr.tooltip) : ''"
          >
              <md-avatar class="md-avatar-icon">
                <md-icon :md-src="addr.addressIcon"></md-icon>
              </md-avatar>

              <div class="md-list-text-container for-address">
                  <div class="block_entry_title">{{ $t('home.your_address_'+addr.system) }}</div>
                  <p> {{ addr.address }}</p>
              </div>

              <div class='md-list-action'>
                <md-icon class="custom-icon">content_copy</md-icon>
              </div>
          </md-list-item>

          <md-list-item
            v-for="wallet in wallets"
            v-bind:key="'bal_' + wallet.system"
            v-on:click="goToTransactions(wallet.system)"
            :title="wallet.balanceTooltip ? $t(wallet.balanceTooltip) : ''"
          >
            <md-avatar class="md-avatar-icon">
                <md-icon :md-src="wallet.balanceIcon"></md-icon>
            </md-avatar>
            <div class="md-list-text-container">
                <span>{{ $t('home.your_balance_' + wallet.system) }}</span>
                <p> <span v-html="wallet.balance"></span> {{ wallet.system }}</p>
            </div>
          </md-list-item>

          <md-list-item v-on:click="$router.push('/transfer/')" :title="$t('home.send_btn_tooltip')">
              <md-avatar class="md-avatar-icon">
                <md-icon md-src="/static/img/Wallet/send.svg"></md-icon>
              </md-avatar>
              <div class="md-list-text-container">
                  <span>{{ $t('home.send_btn') }}</span>
                  <p></p>
              </div>

          </md-list-item>
        <md-list-item v-if="showFreeTokenButton" :href="freeAdmAddress" target="_blank">
              <md-avatar class="md-avatar-icon">
                <md-icon md-src="/static/img/Wallet/free-tokens.svg"></md-icon>
              </md-avatar>

              <div class="md-list-text-container">
                  <span>{{ $t('home.free_adm_btn') }} </span>
                  <p></p>
              </div>
          </md-list-item>

          <md-list-item :href="$t('home.invest_btn_link')+'?wallet='+this.$store.state.address" target="_blank" :title="$t('home.invest_btn_tooltip')">

              <md-avatar class="md-avatar-icon">
                <md-icon md-src="/static/img/Wallet/join-ico.svg"></md-icon>
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
    showFreeTokenButton () {
      return this.$store.state.balance <= 0
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
          tooltip: 'home.your_address_tooltip_ADM',
          balance: this.$store.state.balance,
          balanceTooltip: 'home.your_balance_tooltip_ADM',
          addressIcon: '/static/img/Wallet/adm-address.svg',
          balanceIcon: '/static/img/Wallet/adm-balance.svg'
        },
        {
          system: 'ETH',
          address: this.$store.state.eth.address,
          tooltip: 'home.your_address_tooltip_ETH',
          balance: this.$store.state.eth.balance,
          balanceTooltip: 'home.your_balance_tooltip_ETH',
          addressIcon: '/static/img/Wallet/eth-address.svg',
          balanceIcon: '/static/img/Wallet/eth-balance.svg'
        }
      ]
    }
  },
  watch: {
    'language' (to, from) {
      this.$i18n.locale = to
    }
  },
  mounted () {
    this.$store.commit('last_visited_chat', null)
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
  .home .md-list {
      max-width: 90%;
  }
  .for-address p {
      text-overflow: ellipsis;
      max-width: 100%;
      display: inline-block;
  }
  .home .md-list-text-container p
  {
      font-style: italic;
  }
  .block_entry_title {
    font-weight: 500;
  }
  .md-icon.custom-icon {
    vertical-align: top !important;
    width: 20px !important;
    min-width: 20px !important;
    height: 20px !important;
    min-height: 20px !important;
    font-size: 20px !important;
  }
</style>
