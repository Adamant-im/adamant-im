<template>
  <div :class="classes.root" class="w-100">
    <v-card flat color="transparent" :class="`${classes.root}__card`">
      <WalletsSearchInput @change="searchChanged" />
      <div
        class="v-list v-list--density-default v-list--one-line"
        :class="[
          `${classes.root}__list`,
          'a-scroll-pane',
          isDarkTheme ? 'v-theme--dark' : 'v-theme--light'
        ]"
      >
        <draggable
          :class="classes.draggableList"
          v-model="filteredWallets"
          v-bind="dragOptions"
          handle=".handle"
          item-key="cryptoName"
        >
          <template #item="{ element }">
            <WalletsListItem :wallet="element" :search="search"></WalletsListItem>
          </template>
        </draggable>
        <v-list-item
          v-if="!filteredWallets.length"
          :title="t('wallets.coins_not_found_title')"
          class="text-center"
        ></v-list-item>
      </div>
      <v-row
        class="align-center justify-space-between v-row--no-gutters"
        :class="`${classes.root}__review`"
      >
        <v-spacer></v-spacer>
        <WalletResetDialog></WalletResetDialog>
      </v-row>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CryptosInfo, CryptoSymbol, isErc20 } from '@/lib/constants'
import { useStore } from 'vuex'
import WalletsSearchInput from '@/components/wallets/WalletsSearchInput.vue'
import WalletsListItem from '@/components/wallets/WalletsListItem.vue'
import WalletResetDialog from '@/components/wallets/WalletResetDialog.vue'
import { CoinSymbol } from '@/store/modules/wallets/types'
import { useTheme } from '@/hooks/useTheme'
import { useTimeoutPoll } from '@vueuse/core'

const BALANCE_UPDATE_INTERVAL_MS = 30000

const className = 'wallets-view'
const classes = {
  root: className,
  draggableList: `${className}__draggable-list`
}

const dragOptions = {
  animation: 200,
  disabled: false,
  ghostClass: 'ghost',
  group: 'description'
}

type Wallet = {
  erc20?: boolean
  balance?: number
  cryptoName?: string
  currentRate?: number
  isVisible: boolean
  key?: string
  rate?: number
  symbol: CryptoSymbol
  type?: string
}

const { t } = useI18n()
const store = useStore()
const { isDarkTheme } = useTheme()

const search = ref('')

const orderedAllWalletSymbols = computed<CoinSymbol[]>(() => {
  return store.getters['wallets/getAllOrderedWalletSymbols']
})

const wallets = computed(() => {
  return orderedAllWalletSymbols.value.map((crypto: CoinSymbol) => {
    const symbol = crypto.symbol
    const cryptoName = CryptosInfo[symbol].nameShort || CryptosInfo[symbol].name
    const erc20 = isErc20(symbol)
    const isVisible = crypto.isVisible
    const type =
      CryptosInfo[symbol].type === 'ERC20' ? CryptosInfo[symbol].type : t('wallets.blockchain')

    return {
      cryptoName,
      erc20,
      isVisible,
      symbol,
      type
    }
  })
})

const searchChanged = (value: string | Event) => {
  if (value instanceof Event) return
  search.value = value
}

const lowerCasedSearch = computed(() => {
  return search.value.toLowerCase()
})

const filteredWallets = computed({
  get() {
    return wallets.value.filter((wallet: Wallet) => {
      return (
        wallet.cryptoName?.toLowerCase().includes(lowerCasedSearch.value) ||
        wallet.symbol.toLowerCase().includes(lowerCasedSearch.value)
      )
    })
  },
  set(value) {
    const mappedValue = value.map((item: Wallet) => {
      return {
        symbol: item.symbol,
        isVisible: item.isVisible
      }
    })

    store.dispatch('wallets/setWalletSymbols', mappedValue)
  }
})
const { resume, pause } = useTimeoutPoll(async () => {
  await store.dispatch('updateBalance', {
    requestedByUser: true
  })
}, BALANCE_UPDATE_INTERVAL_MS)

onMounted(() => {
  resume()
})

onBeforeUnmount(() => {
  pause()
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/generic/_variables.scss';

.wallets-view {
  position: relative;
  height: calc(var(--a-layout-height) - var(--toolbar-height));

  @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
    height: calc(var(--a-layout-height-safe) - var(--toolbar-height));
  }

  &__card {
    height: 100%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }

  &__list {
    min-height: 0;
  }

  &__draggable-list {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    width: 100%;
    margin: 0;
  }

  &__review {
    padding-top: 15px !important;
    padding-bottom: 15px !important;
  }
}

.v-theme--dark {
  .wallets-view__list {
    background-color: map.get(colors.$adm-colors, 'black2');
  }
}
</style>
