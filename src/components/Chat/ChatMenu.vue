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
          <icon fill="#BDBDBD">
            <component :is="item.icon"/>
          </icon>
        </v-list-tile-avatar>

        <v-list-tile-title>{{ $t(item.title) }}</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
import Icon from '@/components/icons/BaseIcon'
import AdmFillIcon from '@/components/icons/AdmFill'
import EthFillIcon from '@/components/icons/EthFill'
import BnbFillIcon from '@/components/icons/BnbFill'

export default {
  data: () => ({
    menuItems: [
      {
        title: 'chats.send_adm',
        icon: 'adm-fill-icon',
        currency: 'ADM'
      },
      {
        title: 'chats.send_eth',
        icon: 'eth-fill-icon',
        currency: 'ETH'
      },
      {
        title: 'chats.send_bnb',
        icon: 'bnb-fill-icon',
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
  components: {
    Icon,
    AdmFillIcon,
    EthFillIcon,
    BnbFillIcon
  },
  props: {
    partnerId: {
      type: String,
      default: ''
    }
  }
}
</script>
