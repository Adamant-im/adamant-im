<template>
  <v-card flat :class="classes.root">
    <v-list lines="two" :class="classes.walletCardList">
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
            <span v-if="$store.state.rate.isLoaded" class="a-text-regular">
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

    <WalletCardListActions :class="classes.walletCardList" :crypto="crypto" :is-a-d-m="isADM" />

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
  allCoinNodesDisabled: boolean
  rate: number
}

const classes = {
  root: className,
  walletCardAction: `${className}__action`,
  walletCardIcon: `${className}__icon`,
  walletCardList: `${className}__list`,
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
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.wallet-card {
  &__title {
    @include mixins.a-text-caption();
  }
  &__subtitle {
    @include mixins.a-text-regular-enlarged();
    line-height: 24px;
    word-break: break-word;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    span {
      font-style: italic;
      color: inherit;
    }
  }
  &__list {
    padding: 8px 0 0;
  }
}

::v-deep(.wallet-card__list .wallet-card__tile) {
  padding-inline: 16px;
  padding-left: 28px;
}

/** Themes **/
.v-theme--light {
  .wallet-card {
    background-color: transparent;
    &__list {
      background: inherit;
    }
    &__title {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__subtitle {
      color: map.get(colors.$adm-colors, 'muted');
    }
    &__action {
      color: map.get(colors.$adm-colors, 'muted');
    }
  }
}
.v-theme--dark {
  .wallet-card {
    background-color: transparent;
    &__list {
      background: inherit;
    }
    &__title {
      color: map.get(settings.$shades, 'white');
    }
    &__subtitle {
      color: rgba(map.get(settings.$shades, 'white'), 70%);
    }
  }
}
</style>
