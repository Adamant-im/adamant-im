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
        title: 'chats.send_adm',
        icon: 'mdi-ethereum',
        currency: 'ADM'
      },
      {
        title: 'chats.send_bnb',
        icon: 'mdi-ethereum',
        currency: 'ETH'
      },
      {
        title: 'chats.send_eth',
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
