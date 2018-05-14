<template>
  <md-dialog :md-open-from="openFrom" :md-close-to="closeTo" ref="new_chat_dialog">
    <md-dialog-content>
      <md-layout md-align="center" md-gutter="16" class="new-chat">
        <md-layout md-flex="90" sm-flex="90">
            <md-input-container>
                <label>{{ $t('chats.recipient') }}</label>
                <md-textarea v-model="targetAddress"></md-textarea>
            </md-input-container>
        </md-layout>
        <md-layout md-flex="66" sm-flex="90" style="margin-top: 10px;">
            <md-layout md-align="center" md-gutter="16">
            <md-button class="md-raised md-primary" :title="$t('chats.new_chat_tooltip')" v-on:click="send">{{ $t('chats.new_chat') }}</md-button>
            <md-button class="md-raised md-primary" v-on:click="$router.push('/scan/')"><md-icon>camera_rear</md-icon></md-button>
            </md-layout>
        </md-layout>
      </md-layout>
      <md-snackbar md-position="bottom center" md-accent ref="chatSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
      </md-snackbar>
    </md-dialog-content>
  </md-dialog>
</template>

<script>
export default {
  name: 'new-chat',
  props: ['openFrom', 'closeTo'],
  methods: {
    errorMessage (message) {
      this.formErrorMessage = this.$t('chats.' + message)
      this.$refs.chatSnackbar.open()
    },
    send () {
      if (!this.targetAddress) {
        this.errorMessage('no_address')
        return
      }
      if (!(/U([0-9]{6,})$/.test(this.targetAddress))) {
        this.errorMessage('incorrect_address')
        return
      }
      this.getAddressPublicKey(this.targetAddress).then(
        (key) => {
          if (!key) {
            this.errorMessage('incorrect_address')
          } else {
            this.$store.commit('create_chat', this.targetAddress)
            this.$store.commit('select_chat', this.targetAddress)
            this.$router.push('/chats/' + this.targetAddress + '/')
          }
        },
        () => this.errorMessage('no_connection')
      )
    },
    open () {
      this.$refs['new_chat_dialog'].open()
    }
  },
  computed: {
  },
  watch: { },
  data () {
    return {
      formErrorMessage: '',
      targetAddress: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  .new-chat {
    background-color: #fff;
    padding: 12px;
  }

  @media (min-width: 600px) {
    .new-chat {
      min-width: 420px;
    }
  }
</style>
