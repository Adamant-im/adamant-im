<template>
  <div class="chat">
      <md-layout md-align="start" md-gutter="16">
          <md-layout v-for="message in messages" :key="message.id" md-flex="100">
              <md-layout v-if="message.direction=='from'" md-flex="45" class="md-primary chat_message " md-flex-offset="5" >{{ message.message }}</md-layout>
              <md-layout v-if="message.direction=='to'" md-flex="45" class="md-primary chat_message " md-flex-offset="50" >{{ message.message }} </md-layout>
          </md-layout>
      </md-layout>
      <md-layout md-align="center" md-gutter="16">
      <md-layout md-flex="66" sm-flex="90" class="message_form">
          <md-layout md-flex="90" >
              <md-input-container>
                  <label>MESSAGE</label>
                  <md-textarea v-model="message"></md-textarea>
              </md-input-container>
          </md-layout>
          <md-layout md-flex="10" >
            <md-button class="md-raised md-primary" v-on:click="send">SEND</md-button>
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
      this.encodeMessageForAddress(this.message, this.$route.params.partner)
      this.message = ''
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
.message_form {
    position: fixed;
    bottom: 0;
    width: 100%;
}
.chat_message {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 5px;
}
</style>
