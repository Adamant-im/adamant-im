<template>
  <v-list :class="className">
    <v-list-item @click="sendFunds">
      <template #prepend>
        <v-icon :class="`${className}__icon`" :icon="mdiBankTransferOut" />
      </template>

      <v-list-item-title :class="`${className}__title`">
        {{ t('home.send_crypto', { crypto }) }}
      </v-list-item-title>
    </v-list-item>

    <template v-if="isADM">
      <v-list-item @click="stakeAndEarn">
        <template #prepend>
          <icon :width="24" :height="24"><stake-icon /></icon>
        </template>

        <v-list-item-title :class="`${className}__title`">
          {{ t('home.stake_and_earn_btn') }}
        </v-list-item-title>
      </v-list-item>

      <v-list-item @click="buyTokens">
        <template #prepend>
          <v-icon :class="`${className}__icon`" :icon="mdiFinance" />
        </template>

        <v-list-item-title :class="`${className}__title`">
          {{ t('home.buy_tokens_btn') }}
        </v-list-item-title>
      </v-list-item>

      <v-list-item v-if="!hasAdmTokens" @click="getFreeTokens">
        <template #prepend>
          <v-icon :class="`${className}__icon`" :icon="mdiGift" />
        </template>

        <v-list-item-title :class="`${className}__title`">
          {{ t('home.free_adm_btn') }}
        </v-list-item-title>
      </v-list-item>
    </template>

    <buy-tokens-dialog v-model="showBuyTokensDialog" :adamant-address="$store.state.address" />
  </v-list>
</template>

<script setup lang="ts">
import { CryptoSymbol } from '@/lib/constants/cryptos'
import BuyTokensDialog from '@/components/BuyTokensDialog.vue'
import Icon from '@/components/icons/BaseIcon.vue'
import StakeIcon from '@/components/icons/common/Stake.vue'
import { websiteUriToOnion } from '@/lib/uri'

import { mdiBankTransferOut, mdiFinance, mdiGift } from '@mdi/js'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const className = 'wallet-actions'

type Props = {
  crypto: CryptoSymbol
  isADM: boolean
}

const props = withDefaults(defineProps<Props>(), {
  crypto: 'ADM'
})

const store = useStore()
const router = useRouter()
const { t } = useI18n()

const showBuyTokensDialog = ref(false)

const hasAdmTokens = computed(() => store.state.balance > 0)

const sendFunds = () => {
  router.push({
    name: 'SendFunds',
    params: {
      cryptoCurrency: props.crypto
    }
  })
}

const stakeAndEarn = () => {
  router.push('/votes')
}

const buyTokens = () => {
  showBuyTokensDialog.value = true
}

const getFreeTokens = () => {
  const link = websiteUriToOnion(t('home.free_tokens_link') + '?wallet=' + store.state.address)
  window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.wallet-actions {
  &__title {
    @include mixins.a-text-caption-light();
  }
  :deep(.v-list-item__prepend) {
    > .v-icon {
      margin-inline-end: 16px;
    }
  }
  :deep(.v-list-item) {
    padding: 0 28px;
  }
  :deep(.v-list-item__prepend) {
    > .v-icon {
      opacity: unset;
    }
  }
  :deep(.v-list-item__append) {
    > .v-icon {
      opacity: unset;
    }
  }
}

/** Themes **/
.v-theme--light {
  .wallet-actions {
    &__title,
    &__icon {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .wallet-actions {
    &__title,
    &__icon {
      color: map.get(settings.$shades, 'white');
    }
  }
}
</style>
