<template>
  <div class="chat">
      <md-layout md-align="start" md-gutter="16" class="chat_messages">
          <md-layout v-for="message in messages" :key="message.id" md-flex="100" style="padding-left: 0px;">
              <md-layout
                md-flex="90"
                md-flex-xsmall="85"
                class="chat_message md-whiteframe md-whiteframe-1dp"
                :data-confirmation="message.confirm_class"
                v-bind:class="{
                  'md-flex-xsmall-offset-10': message.direction === 'from',
                  'md-own md-flex-xsmall-offset-5': message.direction === 'to'
                }"
              >
                <span class="avatar-holder"></span>
                <span v-if="message.type !== 0" v-html="message.message" class="msg-holder"></span>
                <span v-if="message.type === 0" class="msg-holder">
                  <p>{{ $t("chats." + (message.direction === "from" ? "sent_label" : "received_label")) }}</p>
                  <p class='transaction-amount' v-on:click="goToTransaction(message.id)">
                    <span v-html="$formatAmount(message.amount)"></span> ADM
                  </p>
                </span>
                <div class="dt">{{ $formatDate(message.timestamp) }}</div>
              </md-layout>
          </md-layout>
          <md-layout style="height:0" md-flex="100"></md-layout>
      </md-layout>
      <md-layout md-align="start" md-gutter="16" class="message_form" style="z-index: 10;">
      <md-layout>
          <md-layout md-flex="10">
            <md-menu md-align-trigger md-size="5">
              <md-button class="attach_button" md-menu-trigger>
                <md-icon>attach_file</md-icon>
              </md-button>
              <md-menu-content>
                <md-menu-item v-on:click="sendTokens('ADM')">
                  <md-icon class="md-size-2x" md-src="/static/img/adm-token.png">menu</md-icon>
                  <span>{{ $t('chats.send_tokens', { crypto: 'ADM' }) }}</span>
                </md-menu-item>
                <md-menu-item v-on:click="sendTokens('ETH')">
                  <md-icon class="md-size-2x" md-src="/static/img/eth-token.png">menu</md-icon>
                  <span>{{ $t('chats.send_tokens', { crypto: 'ETH' }) }}</span>
                </md-menu-item>
                <md-menu-item :disabled="true">
                  <md-icon class="md-size-2x">collections</md-icon>
                  <span>{{ $t('chats.attach_image') }}</span>
                </md-menu-item>
                <md-menu-item :disabled="true">
                  <md-icon class="md-size-2x">insert_drive_file</md-icon>
                  <span>{{ $t('chats.attach_file') }}</span>
                </md-menu-item>
              </md-menu-content>
            </md-menu>
          </md-layout>
          <md-layout md-flex="80"   md-flex-xsmall="85" class="text_block">
              <md-input-container md-inline>
                  <label>{{ $t('chats.message') }}</label>
                  <md-textarea ref="messageField" v-model="message" @keydown.native="kp($event)" @focus="focusHandler" @blur.native="blurHandler"></md-textarea>
                  <span v-if="message_fee" class="md-count">{{ $t('chats.estimate_fee') }}: {{message_fee}}</span>
              </md-input-container>
          </md-layout>
          <md-layout md-flex="10">
              <md-button class="send_button" :title="$t('chats.send_button_tooltip')" v-on:click="send" style="min-width: 76px;min-height: 20px;max-height: 45px;"><md-icon>send</md-icon></md-button>
          </md-layout>
      </md-layout>
    </md-layout>
      <md-snackbar md-position="bottom center" md-accent ref="chatsSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
      </md-snackbar>
  </div>
</template>

<script>
import { Cryptos } from '../lib/constants'

export default {
  name: 'chats',
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
    goToTransaction (id) {
      this.$store.commit('leave_chat')
      // TODO: other cryptos may appear here in future
      const params = { crypto: Cryptos.ADM, tx_id: id }
      this.$router.push({ name: 'Transaction', params })
    },
    sendTokens (crypto) {
      // TODO: think of a more versatile way to get this address (store getter?)
      const promise = crypto === Cryptos.ADM
        ? Promise.resolve(this.$route.params.partner) : this.getStored('eth:address')

      promise.then(address => {
        if (address) {
          this.$store.commit('leave_chat')
          const params = { fixedCrypto: crypto, fixedAddress: address }
          this.$router.push({ name: 'Transfer', params })
        }
      })
    }
  },
  mounted: function () {
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

      let messages = this.$store.getters.currentChatTransactions
      if (this.$store.state.currentChat.messages) {
        messages = messages.concat(Object.values(this.$store.state.currentChat.messages))
      }

      return messages.sort(compare)
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
      message: ''
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
        .md-flex-xsmall-offset-5 {
            margin-left: 5%!important;
        }
        .md-flex-xsmall-offset-10 {
            margin-left: 10%!important;
        }
        .md-toolbar .md-title
        {
            font-size: 16px;
        }

        .text_block {
            margin-left: 10px;
        }
    }
    .chat_message p {
        margin: 0;
        padding: 5px 0;

        overflow-wrap: break-word;
        word-wrap: break-word;

        -ms-word-break: break-all;
        /* This is the dangerous one in WebKit, as it breaks things wherever */
        word-break: break-all;
        /* Instead use this non-standard one: */
        word-break: break-word;

        /* Adds a hyphen where the word breaks, if supported (No Blink) */
        -ms-hyphens: auto;
        -moz-hyphens: auto;
        -webkit-hyphens: auto;
        hyphens: auto;

    }
[data-confirmation=confirmed]:before {
    content: 'done';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
}
[data-confirmation=unconfirmed]:before {
        content: 'query_builder';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
}

.avatar-holder {
    width: 45px;
    height: 45px;
    position: absolute;
    top: 20px;
    right: 0;
    left:auto;
}
.msg-holder {
    margin-top: -10px;
    margin-left: 2px;
}
.msg-holder .transaction-amount {
  font-size: 24px;
  cursor: pointer;
}

    .md-own .avatar-holder{
        position: absolute;
        left:10px;
        right:auto;

        top: 20px;
    }
    .md-own.chat_message {
        padding-left:55px;
        padding-right: 10px;
    }
.avatar-holder:before {
    content: 'assignment_ind';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    font-size: 40px;
    vertical-align: middle;
    line-height: 40px;
}
.chat_messages {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 100%;
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
.chat_message {
    margin-bottom: 20px;
    padding: 25px 10px;

    text-align: left;
    position:relative;
    padding-right: 50px;
    min-height: 0;
}
.chat_message .dt {
    position: absolute;
    top: 0;
    right: 5px;
    font-size: 8px;
    font-style: italic;
}

.chat_message.md-own
{
    margin-left:2.5%;
}
.chat_message
{
    margin-left:7.5%;
}

.chat_messagej:after{
    content: ' ';
    position: absolute;
    width: 0;
    height: 0;
    left: -20px;
    right: auto;
    top: 0px;
    bottom: auto;
    border: 22px solid;
    border-color: #4A4A4A transparent transparent transparent;

}
</style>
