<template>
  <v-list bg-color="transparent" :class="className">
    <v-list-item :active="isSendActive" @click="sendFunds">
      <template #prepend>
        <v-icon :class="`${className}__icon`" :icon="mdiBankTransferOut" />
      </template>

      <v-list-item-title :class="`${className}__title`">
        {{ t('home.send_crypto', { crypto }) }}
      </v-list-item-title>
    </v-list-item>

    <template v-if="isADM">
      <v-list-item :active="isStakeActive" @click="stakeAndEarn">
        <template #prepend>
          <icon :width="WALLET_ACTION_STAKE_ICON_SIZE" :height="WALLET_ACTION_STAKE_ICON_SIZE">
            <stake-icon />
          </icon>
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
import { WALLET_ACTION_STAKE_ICON_SIZE } from '@/components/wallets/helpers/uiMetrics'
import { websiteUriToOnion } from '@/lib/uri'

import { mdiBankTransferOut, mdiFinance, mdiGift } from '@mdi/js'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
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
const route = useRoute()
const { t } = useI18n()

const showBuyTokensDialog = ref(false)

const hasAdmTokens = computed(() => store.state.balance > 0)

const isSendActive = computed(() => {
  return route.name === 'SendFunds' && store.state.options.currentWallet === props.crypto
})

const isStakeActive = computed(() => {
  return route.name === 'Votes'
})

const sendFunds = () => {
  router.push({
    name: 'SendFunds',
    params: {
      cryptoCurrency: props.crypto
    }
  })
}

const stakeAndEarn = () => {
  store.commit('options/setSettingsLastRoute', '/votes')
  store.commit('options/setSettingsScrollPosition', {
    path: '/votes',
    top: 0
  })

  router.push({
    path: '/votes',
    state: {
      forceResetSettingsView: true
    }
  })
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
@use '@/assets/styles/components/_color-roles.scss' as colorRoles;
@use '@/assets/styles/themes/adamant/_mixins.scss';

.wallet-actions {
  --a-wallet-actions-icon-gap: var(--a-space-4);
  --a-wallet-actions-item-padding-inline: var(--a-wallet-card-item-padding-inline-start);
  --a-wallet-actions-row-min-height: var(--a-list-row-min-height);
  --a-wallet-actions-row-padding-block: var(--a-list-row-padding-block);
  --a-wallet-actions-icon-opacity: 1;
  @include colorRoles.a-color-role-primary-surface-var('--a-wallet-actions-title-color');
  @include colorRoles.a-color-role-primary-surface-var('--a-wallet-actions-icon-color');

  &__title {
    @include mixins.a-text-caption-light();
    color: var(--a-wallet-actions-title-color);
  }
  &__icon {
    color: var(--a-wallet-actions-icon-color);
  }
  :deep(.v-list-item__prepend) {
    > .v-icon {
      margin-inline-end: var(--a-wallet-actions-icon-gap);
      opacity: var(--a-wallet-actions-icon-opacity);
    }
  }
  :deep(.v-list-item) {
    padding: 0 var(--a-wallet-actions-item-padding-inline);
  }
  :deep(.v-list-item--density-default.v-list-item--one-line) {
    min-height: var(--a-wallet-actions-row-min-height);
    padding-top: var(--a-wallet-actions-row-padding-block);
    padding-bottom: var(--a-wallet-actions-row-padding-block);
  }
  :deep(.v-list-item__prepend) {
    > .v-icon {
      opacity: var(--a-wallet-actions-icon-opacity);
    }
  }
  :deep(.v-list-item__append) {
    > .v-icon {
      opacity: var(--a-wallet-actions-icon-opacity);
    }
  }
}

.v-theme--light {
  :deep(.v-list-item--active) {
    @include mixins.linear-gradient-light-gray();

    > .v-list-item__overlay {
      opacity: 0;
    }
  }
}

.v-theme--dark {
  :deep(.v-list-item--active) {
    @include mixins.linear-gradient-dark-soft();

    > .v-list-item__overlay {
      opacity: 0;
    }
  }
}
</style>
