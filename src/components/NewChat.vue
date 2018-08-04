<template>
  <div class="new_chat" v-if="isLogged">
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
              <md-button class="md-raised md-primary" :title="$t('chats.new_chat_tooltip')" @click="send">{{ $t('chats.new_chat') }}</md-button>
              <md-button class="md-raised md-primary" @click="scanQRCode">
                {{ $t('chats.scan_recipient_button') === 'chats.scan_recipient_button'? 'Scan' : $t('chats.scan_recipient_button') }}
              </md-button>
            </md-layout>
          </md-layout>
        </md-layout>
        <md-snackbar md-position="bottom center" md-accent ref="chatSnackbar" md-duration="2000">
          <span>{{ formErrorMessage }}</span>
        </md-snackbar>
      </md-dialog-content>
    </md-dialog>
    <QRScan v-if="showModal" :modal="showModal" @hide-modal="showModal = false" @code-grabbed="saveTargetAddress"/>
  </div>
</template>

<script>
import QRScan from '@/components/QRScan'
export default {
  name: 'new-chat',
  components: {
    QRScan
  },
  props: ['openFrom', 'closeTo'],
  methods: {
    scanQRCode () {
      this.showModal = true
    },
    saveTargetAddress (payload) {
      if (payload.match(/U\d*/)) {
        this.targetAddress = payload.match(/U\d*/)[0]
        if (payload.match(/label=/)) {
          this.targetLabel = payload.match(/label=(.*)/)[1].replace('+', ' ')
        }
      } else {
        this.errorMessage('incorrect_address')
        return
      }
      this.send()
    },
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
            const partner = this.$store.state.partnerName
            this.$store.commit('partners/displayName', { partner, displayName: this.targetLabel })
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
  mounted () {
    this.isLogged = this.$store.getters.isLogged
  },
  data () {
    return {
      formErrorMessage: '',
      targetAddress: '',
      targetLabel: '',
      showModal: false,
      isLogged: false
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
