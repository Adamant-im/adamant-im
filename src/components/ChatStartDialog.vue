<template>
  <v-dialog
    v-model="show"
    width="500"
  >
    <v-card>
      <v-card-title
        class="headline grey lighten-2"
        primary-title
      >
        Start new Chat
      </v-card-title>

      <v-layout row wrap justify-center align-center class="pa-3">

        <v-flex xs10>
          <v-text-field
            label="Recipient address"
            v-model="recipientAddress"
          />
        </v-flex>

        <v-flex xs2 class="text-xs-right">
          <v-btn @click="showQrcodeScanner = true" icon flat>
            <v-icon>mdi-qrcode-scan</v-icon>
          </v-btn>
        </v-flex>

        <v-flex xs4 class="text-xs-center">
          <v-btn @click="startChat">Start chat</v-btn>
        </v-flex>

      </v-layout>
    </v-card>

    <qrcode-scanner
      v-if="showQrcodeScanner"
      v-model="showQrcodeScanner"
      @scan="onScanQrcode"
    />
  </v-dialog>
</template>

<script>
import QrcodeScanner from '@/components/QrcodeScanner'

export default {
  computed: {
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    }
  },
  data: () => ({
    recipientAddress: '',
    showQrcodeScanner: false
  }),
  methods: {
    startChat () {
      if (this.isValidUserAddress()) {
        this.$emit('start-chat', this.recipientAddress)
        this.show = false
      } else {
        this.$store.dispatch('snackbar/show', {
          message: 'Invalid recipient address'
        })
      }
    },
    onScanQrcode (userId) {
      this.recipientAddress = userId
      this.startChat()
    },
    isValidUserAddress () {
      return /^U[\d]{6,}$/.test(this.recipientAddress)
    }
  },
  components: {
    QrcodeScanner
  },
  props: {
    value: {
      type: Boolean,
      required: true
    }
  }
}
</script>
