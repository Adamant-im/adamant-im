<template>
  <div class="chats">
    <md-layout md-align="center" md-gutter="16">
      <md-layout md-flex="66" sm-flex="90">
          <md-input-container>
              <label>{{ $t('chats.recipient') }}</label>
              <md-textarea v-model="targetAddress"></md-textarea>
          </md-input-container>
          <md-input-container>
              <label>{{ $t('chats.message') }}</label>
              <md-textarea v-model="message"></md-textarea>
              <span v-if="message_fee" class="md-count">{{ $t('chats.estimate_fee') }}: {{message_fee}}</span>
          </md-input-container>
      </md-layout>
      <md-layout md-flex="66" sm-flex="90">
          <md-layout md-align="center" md-gutter="16">
          <md-button class="md-raised md-primary" v-on:click="send">{{ $t('chats.send_button') }}</md-button>

          </md-layout>
      </md-layout>
    </md-layout>
      <md-snackbar md-position="bottom center" md-accent ref="chatSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
      </md-snackbar>
  </div>
</template>

<script>
export default {
  name: 'chats',
  methods: {
    errorMessage (message) {
      this.formErrorMessage = this.$t('chats.' + message)
      this.$refs.chatSnackbar.open()
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
      if (!this.targetAddress) {
        this.errorMessage('no_address')
        return
      }
      if ((this.message.length * 1.5) > 20000) {
        this.errorMessage('too_long')
        return
      }
      if (!(/U([0-9]{6,})$/.test(this.targetAddress))) {
        this.errorMessage('incorrect_address')
        return
      }
      if (this.message) {
        this.encodeMessageForAddress(this.message, this.targetAddress)
      }
    }
  },
  computed: {
  },
  watch: {
    message: function (value) {
      this.message_fee = Math.ceil(value.length / 255) * 0.005
    }
  },
  data () {
    return {
      message_fee: 0,
      formErrorMessage: '',
      targetAddress: '',
      message: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
