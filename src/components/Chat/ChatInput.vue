<template>
  <div class="chat__input grey lighten-4">
    <v-textarea
      v-model="message"
      hide-details
      single-line
      no-resize
      rows="1"
      :label="$t('typeYourMessage')"
    />
    <v-layout row justify-space-between align-center class="mt-2">
      <v-menu>
        <v-btn
          slot="activator"
          icon
          class="ma-0"
        >
          <v-icon medium>mdi-cash-usd</v-icon>
        </v-btn>

        <v-list>
          <v-list-tile
            v-for="item in menuList"
            :key="item.title"
            @click="sendFunds(item)"
          >
            <v-list-tile-avatar>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-tile-avatar>

            <v-list-tile-title>{{ $t(item.title) }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>

      <v-btn @click="sendMessage" icon class="ma-0">
        <v-icon medium color="blue darken-1">mdi-send</v-icon>
      </v-btn>
    </v-layout>
  </div>
</template>

<script>
export default {
  data: () => ({
    message: '',
    menuList: [
      {
        title: 'sendADM',
        icon: 'mdi-ethereum',
        currency: 'ADM'
      },
      {
        title: 'sendETH',
        icon: 'mdi-ethereum',
        currency: 'ETH'
      },
      {
        title: 'sendBNB',
        icon: 'mdi-ethereum',
        currency: 'BNB'
      }
    ]
  }),
  methods: {
    sendMessage () {
      if (!this.validate()) return false

      this.$store.dispatch('add_message_to_queue', {
        message: this.message,
        recipientId: this.$route.params.partner
      })

      // $emit after rerender
      // and later call scrollToBottom()
      this.$nextTick(() => {
        this.$emit('send', this.message)
        this.message = ''
      })
    },
    validate () {
      if (!this.message) {
        return
      }
      if (this.$store.state.balance < 0.001) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('notEnoughFunds')
        })

        return
      }
      if ((this.message.length * 1.5) > 20000) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('messageTooLong')
        })

        return
      }

      return true
    },
    sendFunds (item) {
      this.$router.push({
        name: 'SendFunds',
        params: {
          cryptoCurrency: item.currency,
          recipientAddress: this.partnerId
        }
      })
    }
  },
  props: {
    partnerId: {
      type: String,
      default: ''
    }
  }
}
</script>

<i18n>
{
  "en": {
    "typeYourMessage": "Type your message",
    "notEnoughFunds": "Not enough funds. Top up your balance.",
    "messageTooLong": "Message is too long",
    "sendADM": "Send ADM",
    "sendETH": "Send ETH",
    "sendBNB": "Send BNB"
  },
  "ru": {
    "typeYourMessage": "Введите сообщение",
    "notEnoughFunds": "Недостаточно токенов. Пополните баланс.",
    "messageTooLong": "Сообщение слишком длинное",
    "sendADM": "Отправить ADM",
    "sendETH": "Отправить ETH",
    "sendBNB": "Отправить BNB"
  }
}
</i18n>
