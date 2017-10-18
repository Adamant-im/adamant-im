<template>
  <div class="chat">
      <md-layout md-align="start" md-gutter="16" class="chat_messages">
          <md-layout v-for="message in messages" :key="message.id" md-flex="100">
              <md-layout v-if="message.direction=='to'" md-flex="80" md-flex-xsmall="70" class="chat_message" :data-confirmation="message.confirm_class" md-flex-offset="5" ><span v-html="message.message"></span><div class="dt">{{ dateFormat(message.timestamp) }}</div></md-layout>
              <md-layout v-if="message.direction=='from'" md-flex="80" md-flex-xsmall="70" :data-confirmation="message.confirm_class"  class=" chat_message md-own md-flex-xsmall-offset-20" md-flex-offset="15" ><span v-html="message.message"></span> <div class="dt">{{ dateFormat(message.timestamp) }}</div></md-layout>
          </md-layout>
      </md-layout>
      <md-layout md-align="start" md-gutter="16" class="message_form">
      <md-layout>
          <md-layout md-flex="90"   md-flex-xsmall="80" class="text_block">
              <md-input-container md-inline>
                  <label>{{ $t('chats.message') }}</label>
                  <md-textarea v-model="message" v-on:keyup.meta.enter="send" v-on:keyup.ctrl.enter="send"></md-textarea>
              </md-input-container>
          </md-layout>
          <md-layout md-flex="10" >
              <md-button class="" v-on:click="send" style="min-width: 76px;min-height: 20px;max-height: 45px;"><md-icon>send</md-icon></md-button>
          </md-layout>
      </md-layout>
    </md-layout>
  </div>
</template>

<script>

export default {
  name: 'chats',
  methods: {
    send () {
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
    '$route': function (value) {
      // switch chat to value
      this.$store.commit('select_chat', value)
    }
  },
  data () {
    return {
      message: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

    @media (max-width: 600px) {
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
    .chat_message p {
        margin: 0;
        padding: 0;
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
.chat_messages {
    overflow-y:scroll;
    max-height:100%;
    height: calc(100vh - 180px);
    margin-top: 80px;
}
.message_form {
    position: fixed;
    bottom: 0;
    width: 100%;
    border-top: 1px solid #484848;
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
}
.chat_message {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid lightgray;
    text-align: left;
    position:relative;
}
.chat_message .dt {
    position: absolute;
    bottom: 0;
    right: 5px;
    font-size: 8px;
    font-style: italic;
}
.md-own {
    border: 1px solid #BAD3FF!important;
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
