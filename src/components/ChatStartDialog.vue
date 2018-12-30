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
        {{ $t('startNewChat') }}
      </v-card-title>

      <v-layout row wrap justify-center align-center class="pa-3">

        <v-flex xs10>
          <v-text-field
            v-model="recipientAddress"
            :rules="validationRules"
            :label="$t('recipientAddress')"
          />
        </v-flex>

        <v-flex xs2 class="text-xs-right">
          <v-btn @click="showQrcodeScanner = true" icon flat>
            <v-icon>mdi-qrcode-scan</v-icon>
          </v-btn>
        </v-flex>

        <v-flex xs4 class="text-xs-center">
          <v-btn @click="startChat">{{ $t('startChat') }}</v-btn>
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
import validateAddress from '@/lib/validateAddress'
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
    },
    validationRules () {
      return [
        v => validateAddress('ADM', v) || this.$t('chats.incorrect_address')
      ]
    }
  },
  data: () => ({
    recipientAddress: '',
    showQrcodeScanner: false
  }),
  methods: {
    startChat () {
      if (!this.isValidUserAddress()) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('chats.incorrect_address')
        })

        return Promise.reject(new Error(this.$t('chats.incorrect_address')))
      }

      return this.$store.dispatch('chat/createChat', {
        partnerId: this.recipientAddress
      })
        .then((key) => {
          this.$emit('start-chat', this.recipientAddress)
          this.show = false
        })
        .catch(err => {
          this.$store.dispatch('snackbar/show', {
            message: err.message // @todo translations
          })
        })
    },
    onScanQrcode (userId) {
      this.recipientAddress = userId
      this.startChat()
    },
    isValidUserAddress () {
      return validateAddress('ADM', this.recipientAddress)
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

<i18n>
{
  "en": {
    "startNewChat": "Start new Chat",
    "recipientAddress": "Recipient address",
    "startChat": "Start chat"
  },
  "ru": {
    "startNewChat": "Новый чат",
    "recipientAddress": "Адрес получателя",
    "startChat": "Начать чат"
  }
}
</i18n>
