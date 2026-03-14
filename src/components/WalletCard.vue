<template>
  <v-card flat color="transparent" :class="classes.root">
    <v-list lines="two" bg-color="transparent" :class="classes.walletCardList">
      <v-list-item :class="classes.walletCardTile" @click="showShareURIDialog = true">
        <v-list-item-title :class="classes.walletCardTitle">
          {{ t('home.wallet_crypto', { crypto: cryptoName }) }}
        </v-list-item-title>
        <v-list-item-subtitle :class="classes.walletCardSubtitle">
          {{ address }}
        </v-list-item-subtitle>

        <template #append>
          <v-btn icon ripple variant="text" :class="classes.walletCardAction">
            <v-icon :class="classes.walletCardIcon" :icon="mdiShareVariant" size="small" />
          </v-btn>
        </template>
      </v-list-item>

      <v-list-item :class="classes.walletCardTile" @click="$emit('click:balance', crypto)">
        <v-list-item-title :class="classes.walletCardTitle">
          {{ t('home.balance') }}
        </v-list-item-title>
        <v-list-item-subtitle :class="classes.walletCardSubtitle">
          <p v-if="!allCoinNodesDisabled">
            {{ xs ? calculatedBalance : calculatedFullBalance }} {{ crypto }}
            <span v-if="showFiatRate" :class="classes.walletCardRate">
              ~{{ rate }} {{ currentCurrency }}
            </span>
            <v-tooltip
              v-if="xs && calculatedFullBalance.toString().length > SIGNIFICANT_DIGITS"
              activator="parent"
              location="top left"
            >
              {{ calculatedFullBalance }}
            </v-tooltip>
          </p>
          <p v-else>{{ t('home.no_active_nodes') }}</p>
        </v-list-item-subtitle>

        <template #append>
          <v-btn icon ripple variant="text" :class="classes.walletCardAction">
            <v-icon :class="classes.walletCardIcon" :icon="mdiChevronRight" size="small" />
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <WalletCardListActions :class="classes.walletCardActions" :crypto="crypto" :is-a-d-m="isADM" />

    <ShareURIDialog
      v-model="showShareURIDialog"
      :address="address"
      :crypto="crypto"
      :is-a-d-m="isADM"
    />
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ShareURIDialog from '@/components/ShareURIDialog.vue'
import WalletCardListActions from '@/components/WalletCardListActions.vue'
import { Cryptos, CryptoSymbol } from '@/lib/constants'
import { useDisplay } from 'vuetify'
import smartNumber from '@/lib/smartNumber'
import currencyAmount from '@/filters/currencyAmount'
import { useStore } from 'vuex'
import { mdiShareVariant, mdiChevronRight } from '@mdi/js'

const SIGNIFICANT_DIGITS = 7
const className = 'wallet-card'

type Props = {
  address: string
  crypto: CryptoSymbol
  cryptoName: string
  currentCurrency: string
  hideFiatRates?: boolean
  allCoinNodesDisabled: boolean
  rate: number
}

const classes = {
  root: className,
  walletCardAction: `${className}__action`,
  walletCardActions: `${className}__actions`,
  walletCardIcon: `${className}__icon`,
  walletCardList: `${className}__list`,
  walletCardRate: `${className}__rate`,
  walletCardSubtitle: `${className}__subtitle`,
  walletCardTile: `${className}__tile`,
  walletCardTitle: `${className}__title`
}

const props = withDefaults(defineProps<Props>(), {
  crypto: 'ADM',
  cryptoName: 'ADAMANT',
  currentCurrency: 'USD'
})

const { t } = useI18n()
const store = useStore()
const { xs } = useDisplay()
const key = props.crypto.toLowerCase()
const showShareURIDialog = ref(false)

const balance = computed(() => {
  return props.crypto === Cryptos.ADM
    ? store.state.balance
    : store.state[key]
      ? store.state[key].balance
      : 0
})

const calculatedBalance = computed(() => {
  return smartNumber(calculatedFullBalance.value)
})

const calculatedFullBalance = computed(() => {
  return balance.value ? currencyAmount(Number(balance.value), props.crypto, true) : 0
})

const isADM = computed(() => {
  return props.crypto === Cryptos.ADM
})

const showFiatRate = computed(() => {
  return !props.hideFiatRates && store.state.rate.isLoaded
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_color-roles.scss' as colorRoles;
@use '@/assets/styles/themes/adamant/_mixins.scss';

.wallet-card {
  --a-wallet-card-surface: var(--a-color-surface-transparent);
  --a-wallet-card-action-color: var(--a-color-text-muted-light);
  @include colorRoles.a-color-role-primary-surface-var('--a-wallet-card-title-color');
  @include colorRoles.a-color-role-subtle-var('--a-wallet-card-subtitle-color');

  background-color: var(--a-wallet-card-surface);

  &__title {
    @include mixins.a-text-caption();
    color: var(--a-wallet-card-title-color);
  }
  &__subtitle {
    @include mixins.a-text-regular-enlarged();
    line-height: var(--a-wallet-card-subtitle-line-height);
    color: var(--a-wallet-card-subtitle-color);
    word-break: break-word;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &__rate {
    @include mixins.a-text-regular();
    font-style: var(--a-font-style-emphasis);
    color: inherit;
  }
  &__list {
    background: var(--a-wallet-card-surface);
    padding-block-start: var(--a-wallet-card-list-padding-top);
    padding-block-end: 0;
  }

  &__action {
    color: var(--a-wallet-card-action-color);
  }
}

::v-deep(.wallet-card__list .wallet-card__tile) {
  padding-inline-start: var(--a-wallet-card-item-padding-inline-start);
  padding-inline-end: var(--a-wallet-card-item-padding-inline-end);
}

.v-theme--dark {
  .wallet-card {
    --a-wallet-card-action-color: var(--a-color-text-inverse);
  }
}
</style>
