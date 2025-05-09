<template>
  <v-dialog v-model="show" width="320">
    <v-card>
      <v-card-title class="a-text-header">
        {{ t('home.buy_tokens_btn') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-0">
        <v-list>
          <v-list-item avatar @click="openLink('U5149447931090026688')">
            <template #prepend>
              <icon><exchanger-icon /></icon>
            </template>

            <v-list-item-title>{{ t('home.buy_tokens_exchanger') }}</v-list-item-title>
          </v-list-item>

          <v-list-item avatar @click="openLink(admLink)">
            <template #prepend>
              <icon><adamant-icon /></icon>
            </template>

            <v-list-item-title>{{ t('home.buy_tokens_anonymously') }}</v-list-item-title>
          </v-list-item>

          <v-list-item
            avatar
            @click="openLink('https://coinmarketcap.com/currencies/adamant-messenger/#markets')"
          >
            <template #prepend>
              <icon><coinmarketcap-icon /></icon>
            </template>

            <v-list-item-title>{{
              t('home.exchanges_on', { aggregator: 'CoinMarketCap' })
            }}</v-list-item-title>
          </v-list-item>

          <v-list-item
            avatar
            @click="openLink('https://www.coingecko.com/en/coins/adamant-messenger#markets')"
          >
            <template #prepend>
              <icon><coingecko-icon /></icon>
            </template>

            <v-list-item-title>{{
              t('home.exchanges_on', { aggregator: 'CoinGecko' })
            }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import validateAddress from '@/lib/validateAddress'
import { websiteUriToOnion } from '@/lib/uri'

import AdamantIcon from '@/components/icons/common/Adamant.vue'
import CoingeckoIcon from '@/components/icons/common/Coingecko.vue'
import CoinmarketcapIcon from '@/components/icons/common/Coinmarketcap.vue'
import ExchangerIcon from '@/components/icons/common/Exchanger.vue'
import Icon from '@/components/icons/BaseIcon.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  adamantAddress: {
    type: String,
    default: undefined,
    validator: (v: string) => validateAddress('ADM', v)
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const router = useRouter()

const show = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const admLink = computed(() =>
  websiteUriToOnion(
    props.adamantAddress
      ? `${t('home.buy_tokens_btn_link')}?wallet=${props.adamantAddress}`
      : `${t('home.buy_tokens_btn_link')}`
  )
)

const closeDialog = () => {
  show.value = false
}

const openLink = (link: string) => {
  if (link.startsWith('U')) {
    router.push({
      name: 'Chat',
      params: { partnerId: link }
    })
  } else {
    window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
  }

  closeDialog()
}
</script>
