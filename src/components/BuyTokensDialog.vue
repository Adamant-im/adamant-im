<template>
  <v-dialog v-model="show" width="320" :class="className">
    <v-card>
      <v-card-title class="a-text-header">
        {{ $t('home.buy_tokens_btn') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-0">
        <v-list>
          <v-list-item avatar @click="openLink('U5149447931090026688')">
            <template #prepend>
              <icon><exchanger-icon /></icon>
            </template>

            <v-list-item-title>{{ $t('home.buy_tokens_exchanger') }}</v-list-item-title>
          </v-list-item>

          <v-list-item avatar @click="openLink(admLink)">
            <template #prepend>
              <icon><adamant-icon /></icon>
            </template>

            <v-list-item-title>{{ $t('home.buy_tokens_anonymously') }}</v-list-item-title>
          </v-list-item>

          <v-list-item avatar @click="openLink('https://azbit.com/?referralCode=9YVWYAF')">
            <template #prepend>
              <icon><azbit-icon /></icon>
            </template>

            <v-list-item-title>Azbit</v-list-item-title>
          </v-list-item>

          <v-list-item
            avatar
            @click="openLink('https://stakecube.net/app/exchange/adm_usdt?layout=pro&team=adm')"
          >
            <template #prepend>
              <icon><stake-cube-icon /></icon>
            </template>

            <v-list-item-title>StakeCube</v-list-item-title>
          </v-list-item>

          <v-list-item
            avatar
            @click="openLink('https://h5.coinstore.com/h5/signup?invitCode=o951vZ')"
          >
            <template #prepend>
              <icon><coinstore-icon /></icon>
            </template>

            <v-list-item-title>Coinstore</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import validateAddress from '@/lib/validateAddress'
import Icon from '@/components/icons/BaseIcon'
import AdamantIcon from '@/components/icons/common/Adamant'
import AzbitIcon from '@/components/icons/common/Azbit'
import ExchangerIcon from '@/components/icons/common/Exchanger'
import StakeCubeIcon from '@/components/icons/common/StakeCube.vue'
import CoinstoreIcon from '@/components/icons/common/Coinstore.vue'
import { websiteUriToOnion } from '@/lib/uri'

export default {
  components: {
    Icon,
    AdamantIcon,
    AzbitIcon,
    ExchangerIcon,
    StakeCubeIcon,
    CoinstoreIcon
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    adamantAddress: {
      type: String,
      default: undefined,
      validator: (v) => validateAddress('ADM', v)
    }
  },
  emits: ['update:modelValue'],
  computed: {
    className: () => 'buy-tokens-dialog',
    admLink() {
      return websiteUriToOnion(
        this.adamantAddress
          ? `${this.$t('home.buy_tokens_btn_link')}?wallet=${this.adamantAddress}`
          : `${this.$t('home.buy_tokens_btn_link')}`
      )
    },
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  methods: {
    openLink(link) {
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
