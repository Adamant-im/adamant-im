<template>
  <!--TODO: Move all non-static content to @/assets/-->
  <div class="chat">
      <md-layout md-align="start" md-gutter="16" class="chat_messages">
          <md-layout v-for="message in messages" :key="message.id" md-flex="100" style="padding-left: 0px;">
            <chat-entry :readOnly="readOnly" :message="message"></chat-entry>
          </md-layout>
          <md-layout style="height:0" md-flex="100"></md-layout>
      </md-layout>
      <md-layout md-align="start" md-gutter="16" class="message_form" style="z-index: 10;">
      <md-layout style='padding-left: 0;' v-show="!readOnly">
          <md-layout md-flex="10">
            <md-menu class="attach_menu" md-align-trigger md-size="4">
              <md-button md-menu-trigger style="min-height: 45px;max-height: 45px; min-width: 60px;margin-left:0;">
                <md-icon md-src="/static/img/Attach/attach.svg"></md-icon>
              </md-button>
              <md-menu-content class="attach_menu">
                <md-menu-item v-on:click="sendTokens('ADM')">
                  <md-icon md-src="/static/img/Attach/adm.svg">menu</md-icon>
                  <span>{{ $t('chats.send_adm') }}</span>
                </md-menu-item>
                <md-menu-item v-on:click="sendTokens('ETH')">
                  <md-icon  md-src="/static/img/Attach/ethereum.svg">menu</md-icon>
                  <span>{{ $t('chats.send_eth') }}</span>
                </md-menu-item>
                <md-menu-item :disabled="true">
                  <md-icon md-src="/static/img/Attach/picture.svg">collections</md-icon>
                  <span>{{ $t('chats.attach_image') }}</span>
                </md-menu-item>
                <md-menu-item :disabled="true">
                  <md-icon  md-src="/static/img/Attach/file.svg"></md-icon>
                  <span>{{ $t('chats.attach_file') }}</span>
                </md-menu-item>
              </md-menu-content>
            </md-menu>
          </md-layout>
          <md-layout md-flex="80" md-flex-xsmall="75" class="text_block" v-if="!readOnly">
              <md-input-container md-inline>
                  <label>{{ $t('chats.message') }}</label>
                  <md-textarea ref="messageField" v-model="message" @keydown.native="kp($event)" @focus="focusHandler" @blur.native="blurHandler"></md-textarea>
                  <span v-if="message_fee" class="md-count">{{ $t('chats.estimate_fee') }}: {{message_fee}}</span>
              </md-input-container>
          </md-layout>
          <md-layout md-flex="10" v-if="!readOnly">
              <md-button class="send_button" :title="$t('chats.send_button_tooltip')" v-on:click="send" style="min-width: 76px;min-height: 20px;max-height: 45px;"><md-icon>send</md-icon></md-button>
          </md-layout>
      </md-layout>
    </md-layout>
      <md-snackbar md-position="bottom center" md-accent ref="chatsSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
      </md-snackbar>
    <md-dialog-alert
      :md-title="$t('transfer.no_address_title', { crypto: sendToCrypto })"
      :md-content-html="$t('transfer.no_address_text', { crypto: sendToCrypto })"
      ref="no_address_dialog"
    />
  </div>
</template>

<script>
import ChatEntry from './chat/ChatEntry.vue'
import { Cryptos } from '../lib/constants'

export default {
  name: 'chats',
  components: { ChatEntry },
  methods: {
    blurHandler: function (event) {
      if (/iP(hone|od|ad)/.test(navigator.platform)) {
        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/)
        if (parseInt(v[1], 10) === 11) {
          var form = document.getElementsByClassName('message_form')[0]
          form.style.position = 'fixed'
          form.style.bottom = '0'
        }
      }
    },
    focusHandler: function (event) {
      if (/iP(hone|od|ad)/.test(navigator.platform)) {
        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/)
        if (parseInt(v[1], 10) === 11) {
          var form = document.getElementsByClassName('message_form')[0]
          form.style.position = 'absolute'
        }
      }
    },
    kp: function (event) {
      if (/iP(hone|od|ad)/.test(navigator.platform)) {
        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/)
        if (parseInt(v[1], 10) === 11) {
          var form = document.getElementsByClassName('message_form')[0]
          form.style.position = 'absolute'
          var keyboardHeight = 220
          if (window.innerHeight > window.innerWidth) {
            keyboardHeight = 250
          }
          if (navigator.userAgent.indexOf('CriOS/') > 0) {
            keyboardHeight += 50
          }
          form.style.bottom = keyboardHeight + 'px'
          var body = document.getElementByTagName('body')[0]
          body.style.position = 'fixed'
          body.style.height = '100%'
          body.style.width = '100%'
          body.style.overflow = 'hidden'
        }
      }
      if (this.$store.state.sendOnEnter && event.key === 'Enter' && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
        this.send()
      }
      if (!this.$store.state.sendOnEnter) {
        if ((event.key === 'Enter' && event.ctrlKey) || (event.metaKey === true && event.key === 'Enter')) {
          this.send()
        }
      }
    },
    errorMessage (message) {
      this.formErrorMessage = this.$t('chats.' + message)
      this.$refs.chatsSnackbar.open()
    },
    send () {
      this.$refs.messageField.$el.focus()
      if (this.$store.state.balance < 0.001) {
        this.errorMessage('no_money')
        return
      }
      if (!this.message) {
        this.errorMessage('no_empty')
        return
      }
      if ((this.message.length * 1.5) > 20000) {
        this.errorMessage('too_long')
        return
      }
      if (this.message) {
        var message = this.message
        var partner = this.$route.params.partner
        this.encodeMessageForAddress(message, partner, this)
        this.message = ''
        this.$refs.messageField.$el.value = ''
      }
    },
    sendTokens (crypto) {
      this.sendToCrypto = crypto

      let promise = Promise.resolve(true)
      // For cryptos other than ADM we need to fetch the respective account address first
      if (crypto !== Cryptos.ADM) {
        const params = { crypto, partner: this.$route.params.partner }
        promise = this.$store.dispatch('partners/fetchAddress', params).then(address => {
          if (!address) this.$refs['no_address_dialog'].open()
          return !!address
        })
      }

      // If it's ADM or target address is available, we're good to go
      promise.then(addressOk => {
        if (!addressOk) return

        this.$store.commit('leave_chat')
        const params = { fixedCrypto: crypto, fixedAddress: this.$route.params.partner }
        this.$router.push({ name: 'Transfer', params })
      })
    }
  },
  mounted: function () {
    this.$store.commit('last_visited_chat', this.$route.params.partner)
    this.$store.commit('select_chat', this.$route.params.partner)
    this.$store.commit('mark_as_read_total', this.$route.params.partner)
    this.$store.commit('mark_as_read', this.$route.params.partner)
    setTimeout((function (self) {
      return function () {
        self.needToScroll()
      }
    })(this),
    10)
  },
  computed: {
    messages: function () {
      function compare (a, b) {
        if (a.timestamp < b.timestamp) {
          return -1
        }
        if (a.timestamp > b.timestamp) {
          return 1
        }
        return 0
      }

      const chat = this.$store.state.currentChat.messages || { }
      const transactions = this.$store
        .getters['adm/partnerTransactions'](this.$store.state.currentChat.partner)
        .filter(x => !chat[x.id])
      const messages = Object.values(chat).concat(transactions)

      return messages.sort(compare)
    },
    readOnly: function () {
      return this.$store.state.currentChat.readOnly === true
    }
  },
  watch: {
    message: function (value) {
      if (window.feeCalcTimeout) {
        clearTimeout(window.feeCalcTimeout)
      }
      window.feeCalcTimeout = setTimeout((function (self) {
        return function () {
          self.message_fee = Math.ceil(value.length / 255) * 100000 / 100000000
        }
      })(this), 1000)
    },
    '$route': function (value) {
      // switch chat to value
      this.$store.commit('select_chat', value)
      this.$store.commit('mark_as_read_total', value)
      this.$store.commit('mark_as_read', value)
      setTimeout((function (self) {
        return function () {
          self.needToScroll()
        }
      })(this),
      10)
    }
  },
  data () {
    return {
      message_fee: 0,
      formErrorMessage: '',
      message: '',
      sendToCrypto: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  @media (max-width: 600px) {
    .chat_messages {
      margin-left: -8px!important;
    }

    .send_button, .attach_button {
      min-width: 40px!important;
      padding: 0!important;
      margin: 6px 0px!important;
    }
    .md-flex-xsmall-offset-20
    {
      margin-left: 25%;
    }
    .md-toolbar .md-title
    {
      font-size: 16px;
    }

    .text_block {
      margin-left: 10px;
    }
  }

  .avatar-holder {
    width: 38px;
    height: 38px;
    position: absolute;
    top: 20px;
    right: 0;
    left:auto;
    opacity: 0.8;
  }

  .md-own .avatar-holder{
    position: absolute;
    left:10px;
    right:auto;
    top: 12px;
  }

  .md-own.chat_message {
    padding-left:55px;
    padding-right: 10px;
    border-left: 3px #ebebeb solid;
  }
  .avatar-holder:before {
    content: 'account_circle';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    font-size: 30px;
    vertical-align: middle;
    line-height: 30px;
  }
  .chat_messages {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(100vh - 180px);
    margin-top: 80px;
    padding-top: 10px;
    margin-left: 0!important;
  }
  .message_form {
    position: fixed;
    bottom: 0;
    width: 100%;
    border-top: 3px solid rgba(153, 153, 153, 0.2);
    background-color: #fefefe;
    margin: 0 auto;
    max-width: 800px;
    margin-left:0!important;
  }
  .md-toolbar.md-theme-grey {
    position: fixed;
    width: 100%;
    top: 0;
    max-width: 800px;
    margin: 0 auto;
    left: 0;
    right: 0;
    z-index: 10;
    /* background: rgba(153, 153, 153, 0.2); */
    background: #ebebeb;
    border-bottom: none;
  }
  .attach_menu .md-list-item.md-menu-item {
    background-color: rgba(255,255,255,1);
  }
  .attach_menu .md-list-item.md-menu-item.md-disabled {
    color: gray;
  }
  .chat_entry {
    display: flex;
  }
  .attach_menu {
    background: white;
  }
  .md-dialog-container.md-active .md-dialog {
    background: #fefefe;
  }
  .chat_message .dt {
    right: 10px;
  }
</style>
