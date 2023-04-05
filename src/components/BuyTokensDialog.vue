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
          <v-list-item
            avatar
            @click="openLink('U5149447931090026688')"
          >
            <template #prepend>
              <icon><exchanger-icon /></icon>
            </template>

            <v-list-item-title>{{ $t('home.buy_tokens_exchanger') }}</v-list-item-title>
          </v-list-item>

          <v-list-item
            v-for="action in actions"
            :key="action.title"
            avatar
            @click="openLink(action.link)"
          >
            <template #prepend>
              <crypto-icon :crypto="action.icon" />
            </template>

            <v-list-item-title v-text="action.title" />
          </v-list-item>

          <v-list-item
            avatar
            @click="openLink('https://coindeal.com/ref/9WZN')"
          >
            <template #prepend>
              <icon><cdl-icon /></icon>
            </template>

            <v-list-item-title>CoinDeal</v-list-item-title>
          </v-list-item>
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
    modelValue: {
      type: Boolean,
      required: true
    },
    adamantAddress: {
      type: String,
      default: undefined,
      validator: v => validateAddress('ADM', v)
    }
  },
  emits: ['update:modelValue'],
  computed: {
    className: () => 'buy-tokens-dialog',
    show: {
      get () {
        return this.modelValue
      },
      set (value) {
        this.$emit('update:modelValue', value)
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
