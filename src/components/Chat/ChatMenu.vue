<template>
  <v-menu>
    <v-btn
      slot="activator"
      icon
      class="ma-0"
    >
      <v-icon medium>mdi-coin</v-icon>
    </v-btn>

    <v-list>
      <v-list-tile
        v-for="item in menuItems"
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
</template>

<script>
export default {
  data: () => ({
    menuItems: [
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
    "sendADM": "Send ADM",
    "sendETH": "Send ETH",
    "sendBNB": "Send BNB"
  },
  "ru": {
    "sendADM": "Отправить ADM",
    "sendETH": "Отправить ETH",
    "sendBNB": "Отправить BNB"
  }
}
</i18n>
