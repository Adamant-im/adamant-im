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
        {{ $t('home.buy_tokens_btn') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-0">
        <v-list>
          <v-list-tile
            avatar
            @click="openLink('U5149447931090026688')"
          >
            <v-list-tile-avatar>
              <icon><exchanger-icon /></icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{ $t('home.buy_tokens_exchanger') }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile
            v-for="action in actions"
            :key="action.title"
            avatar
            @click="openLink(action.link)"
          >
            <v-list-tile-avatar>
              <crypto-icon :crypto="action.icon" />
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title v-text="action.title" />
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile
            avatar
            @click="openLink('https://coindeal.com/ref/9WZN')"
          >
            <v-list-tile-avatar>
              <icon><cdl-icon /></icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>CoinDeal</v-list-tile-title>
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
import CdlIcon from '@/components/icons/common/Cdl'
import ExchangerIcon from '@/components/icons/common/Exchanger'
import { websiteUriToOnion } from '@/lib/uri'

export default {
  components: {
    Icon,
    CryptoIcon,
    CdlIcon,
    ExchangerIcon
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
  },
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
          link: websiteUriToOnion(this.adamantAddress
            ? `${this.$t('home.buy_tokens_btn_link')}?wallet=${this.adamantAddress}`
            : `${this.$t('home.buy_tokens_btn_link')}`)
        }
      ]
    }
  },
  methods: {
    openLink (link) {
      if (link.startsWith('U')) {
        this.$router.push({
          name: 'Chat',
          params: { partnerId: link }
        })
      } else {
        window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
      }
    }
  }
}
</script>
