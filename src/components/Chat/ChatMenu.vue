<template>
  <v-menu>
    <v-icon medium class="chat-menu__icon" slot="activator">mdi-plus-circle-outline</v-icon>

    <v-list>

      <template v-for="item in menuItems">

        <!-- Cryptos -->
        <v-list-tile
          v-if="item.type === 'crypto'"
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

        <!-- Actions -->
        <v-list-tile
          v-else-if="item.type === 'action'"
          :key="item.title"
          :disabled="item.disabled"
        >
          <v-list-tile-avatar>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-avatar>

          <v-list-tile-title>{{ $t(item.title) }}</v-list-tile-title>
        </v-list-tile>

      </template>

    </v-list>
  </v-menu>
</template>

<script>
import Icon from '@/components/icons/BaseIcon'
import AdmFillIcon from '@/components/icons/AdmFill'
import EthFillIcon from '@/components/icons/EthFill'
import BnbFillIcon from '@/components/icons/BnbFill'
import BnzFillIcon from '@/components/icons/BnzFill'
import DogeFillIcon from '@/components/icons/DogeFill'

export default {
  data: () => ({
    menuItems: [
      {
        type: 'crypto',
        title: 'chats.send_adm',
        icon: 'adm-fill-icon',
        currency: 'ADM'
      },
      {
        type: 'crypto',
        title: 'chats.send_eth',
        icon: 'eth-fill-icon',
        currency: 'ETH'
      },
      {
        type: 'crypto',
        title: 'chats.send_bnb',
        icon: 'bnb-fill-icon',
        currency: 'BNB'
      },
      {
        type: 'crypto',
        title: 'chats.send_bz',
        icon: 'bnz-fill-icon',
        currency: 'BZ'
      },
      {
        type: 'crypto',
        title: 'chats.send_doge',
        icon: 'doge-fill-icon',
        currency: 'DOGE'
      },
      {
        type: 'action',
        title: 'chats.attach_image',
        icon: 'mdi-image',
        disabled: true
      },
      {
        type: 'action',
        title: 'chats.attach_file',
        icon: 'mdi-file',
        disabled: true
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
        },
        query: {
          from: `/chats/${this.partnerId}`
        }
      })
    }
  },
  components: {
    Icon,
    AdmFillIcon,
    EthFillIcon,
    BnbFillIcon,
    BnzFillIcon,
    DogeFillIcon
  },
  props: {
    partnerId: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

/** Themes **/
.theme--light
  .chat-menu
    &__icon
      color: $grey.darken-1
.theme--dark
  .chat-menu
    &__icon
      color: $shades.white
</style>
