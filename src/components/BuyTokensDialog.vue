<template>
  <v-dialog
    v-model="show"
    width="320"
    :class="className"
  >
    <v-card>
      <v-card-title
        class="a-text-header"
      >
        {{ $t('home.invest_btn') }}
      </v-card-title>

      <v-divider class="a-divider"></v-divider>

      <v-card-text class="pa-0">

        <v-list>
          <v-list-tile
            v-for="action in actions"
            :key="action.title"
            avatar
            @click="openLink(action.link)"
          >
            <v-list-tile-avatar>
              <crypto-icon :crypto="action.icon"/>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title v-text="action.title"></v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile @click="openLink('https://idcm.io/trading/ADM_BTC?code=LM5510')">
            <v-list-tile-avatar>
              <icon><idcm-icon/></icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>IDCM</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>

      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import validateAddress from '@/lib/validateAddress'
import Icon from '@/components/icons/BaseIcon'
import CryptoIcon from '@/components/icons/CryptoIcon'
import IdcmIcon from '@/components/icons/common/Idcm'

export default {
  computed: {
    className: () => 'buy-tokens-dialog',
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    },
    actions () {
      return [
        {
          icon: 'ADM',
          title: this.$t('home.buy_tokens_anonymously'),
          link: this.adamantAddress
            ? `https://adamant.im/buy-tokens/?referal=U1287231934743320628&wallet=${this.adamantAddress}`
            : 'https://adamant.im/buy-tokens/?referal=U1287231934743320628'
        },
        {
          icon: 'RES',
          title: 'Resfinex',
          link: 'https://trade.resfinex.com?ref=7ccb34d867&pair=ADM_USDT'
        },
        {
          icon: 'BZ',
          title: 'Bit-Z',
          link: 'https://www.bit-z.com/exchange/adm_usdt?invite_code=2423317'
        }
      ]
    }
  },
  methods: {
    openLink (link) {
      window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
    }
  },
  components: {
    Icon,
    CryptoIcon,
    IdcmIcon
  },
  props: {
    value: {
      type: Boolean,
      required: true
    },
    adamantAddress: {
      type: String,
      default: undefined,
      validator: v => validateAddress('ADM', v)
    }
  }
}
</script>
