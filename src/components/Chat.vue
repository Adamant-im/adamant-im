<template>
  <div class="chat">
      <md-layout md-align="start" md-gutter="16" class="chat_messages">
          <md-layout v-for="message in messages" :key="message.id" md-flex="100">
              <md-layout v-if="message.direction=='to'" md-flex="95" md-flex-xsmall="85" class="chat_message  md-whiteframe md-whiteframe-1dp md-flex-xsmall-offset-10" :data-confirmation="message.confirm_class"  md-flex-offset="5" ><span class="avatar-holder"></span><span v-html="message.message"></span><div class="dt">{{ dateFormat(message.timestamp) }}</div></md-layout>
              <md-layout v-if="message.direction=='from'" md-flex="95" md-flex-xsmall="85" :data-confirmation="message.confirm_class"  class=" chat_message md-own md-flex-xsmall-offset-5 md-whiteframe md-whiteframe-1dp" ><span class="avatar-holder"></span><span v-html="message.message"></span> <div class="dt">{{ dateFormat(message.timestamp) }}</div></md-layout>
          </md-layout>
      </md-layout>
      <md-layout md-align="start" md-gutter="16" class="message_form" style="z-index: 10;">
      <md-layout>
          <md-layout md-flex="90"   md-flex-xsmall="80" class="text_block">
              <md-input-container md-inline>
                  <label>{{ $t('chats.message') }}</label>
                  <md-textarea v-model="message" @keydown.native="kp($event)" ></md-textarea>
                  <span v-if="message_fee" class="md-count">{{ $t('chats.estimate_fee') }}: {{message_fee}}</span>
              </md-input-container>
          </md-layout>
          <md-layout md-flex="10" >
              <md-button class="" v-on:click="send" style="min-width: 76px;min-height: 20px;max-height: 45px;"><md-icon>send</md-icon></md-button>
          </md-layout>
      </md-layout>
    </md-layout>
      <md-snackbar md-position="bottom center" md-accent ref="chatsSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
      </md-snackbar>
  </div>
</template>

<script>

export default {
  name: 'chats',
  methods: {
    kp: function (event) {
      if (event.key === 'Enter' && event.ctrlKey) {
        this.send()
      }
    },
    errorMessage (message) {
      this.formErrorMessage = this.$t('chats.' + message)
      this.$refs.chatsSnackbar.open()
    },
    send () {
      if (this.$store.state.balance < 0.005) {
        this.errorMessage('no_money')
        return
      }
      if (!this.message) {
        this.errorMessage('no_empty')
        return
      }
      if (this.message) {
        this.encodeMessageForAddress(this.message, this.$route.params.partner)
        this.message = ''
      }
    },
    dateFormat: function (timestamp) {
      var date = new Date(parseInt(timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0))
      var options = {'weekday': 'short'}
      return date.toLocaleDateString('ru-RU', options) + ', ' + date.toLocaleTimeString().substring(0, 5)
    }
  },
  mounted: function () {
    this.$store.commit('select_chat', this.$route.params.partner)
    setTimeout((function (self) {
      return function () {
        self.needToScroll() // Thing you wanted to run as non-window 'this'
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
      if (this.$store.state.currentChat.messages) {
        return Object.values(this.$store.state.currentChat.messages).sort(compare)
      }
      return []
    }
  },
  watch: {
    message: function (value) {
      this.message_fee = Math.ceil(value.length / 255) * 0.005
    },
    '$route': function (value) {
      // switch chat to value
      this.$store.commit('select_chat', value)
      setTimeout((function (self) {
        return function () {
          self.needToScroll() // Thing you wanted to run as non-window 'this'
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
        .md-flex-xsmall-offset-20
        {
            margin-left: 25%;
        }
        .md-flex-xsmall-offset-5 {
            margin-left: 5%;
        }
        .md-flex-xsmall-offset-10 {
            margin-left: 10%;
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
        padding: 0;

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
    background: rgba(153, 153, 153, 0.2);
    border-bottom: none;
}
.chat_message {
    margin-bottom: 20px;
    padding: 25px 10px;

    text-align: left;
    position:relative;
    padding-right: 50px;
}
.chat_message .dt {
    position: absolute;
    top: 0;
    right: 5px;
    font-size: 8px;
    font-style: italic;
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
