<template>
  <pull-down @action="updateBalances" :action-text="t('chats.pull_down_actions.update_balances')">
    <v-row justify="center" :class="className">
      <container disableMaxWidth>
        <v-sheet color="transparent" :class="`${className}__card`">
          <!-- Wallets -->
          <v-sheet color="transparent" :class="`${className}__wallets`">
            <v-tabs
              v-model="currentWallet"
              :class="`${className}__tabs`"
              grow
              stacked
              height="auto"
              show-arrows
              center-active
            >
              <v-tab
                v-for="(wallet, index) in wallets"
                :key="wallet.cryptoCurrency"
                :value="wallet.cryptoCurrency"
              >
                <wallet-tab
                  :wallet="wallet"
                  :fiat-currency="currentCurrency"
                  :is-balance-valid="balances[index]"
                  :is-refreshing="isRefreshing"
                />
              </v-tab>
            </v-tabs>

            <v-window
              v-model="currentWallet"
              :touch="{
                start: () => {
                  // Due to `stopPropagation` the `<PullDown/>` component cannot
                  // catch `touchstart` event by itself, ending in a swipe bug.
                  //
                  // Override Vuetify swipe `start` event to prevent
                  // `originalEvent.stopPropagation()`
                  // @source https://github.com/vuetifyjs/vuetify/blob/master/packages/vuetify/src/components/VWindow/VWindow.tsx#L208
                  //
                  // Note: Don't remove this function and leave it empty.
                }
              }"
            >
              <v-window-item
                v-for="wallet in wallets"
                :key="wallet.cryptoCurrency"
                :value="wallet.cryptoCurrency"
              >
                <wallet-card
                  :address="wallet.address"
                  :all-coin-nodes-disabled="areNodesDisabled(wallet.cryptoCurrency)"
                  :crypto="wallet.cryptoCurrency"
                  :crypto-name="wallet.cryptoName"
                  :rate="wallet.rate"
                  :current-currency="currentCurrency"
                  @click:balance="handleBalanceClick"
                >
                  <template #icon>
                    <crypto-icon :crypto="wallet.cryptoCurrency" size="large" />
                  </template>
                </wallet-card>
              </v-window-item>
            </v-window>
          </v-sheet>
        </v-sheet>
      </container>
    </v-row>
  </pull-down>
</template>

<script setup lang="ts">
import WalletCard from '@/components/WalletCard.vue'
import WalletTab from '@/components/WalletTab.vue'
import type { Wallet } from '@/components/WalletTab.vue'
import CryptoIcon from '@/components/icons/CryptoIcon.vue'
import { PullDown } from '@/components/common/PullDown'
import { Cryptos, CryptosInfo, CryptoSymbol, isErc20 } from '@/lib/constants'
import { vibrate } from '@/lib/vibrate'
import { useStore } from 'vuex'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CoinSymbol } from '@/store/modules/wallets/types'
import { useI18n } from 'vue-i18n'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { useBalanceCheck } from '@/hooks/useBalanceCheck'
import { Tab, TABS } from '@/components/nodes/types'

const { t } = useI18n()
const store = useStore()
const route = useRoute()
const router = useRouter()
const balances = useBalanceCheck()

const className = 'account-view'

const isRefreshing = ref(false)

const orderedVisibleWalletSymbols = computed(() => {
  return store.getters['wallets/getVisibleOrderedWalletSymbols']
})

const currentCurrency = computed({
  get() {
    return store.state.options.currentRate
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'currentRate',
      value
    })
  }
})

const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
const allAdmNodesDisabled = computed(() =>
  admNodes.value.every((node) => node.status === 'disabled')
)
const coinNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/coins'])
const allCoinNodesDisabled = computed(() =>
  coinNodes.value.every((node) => node.status === 'disabled')
)
const wallets = computed<Wallet[]>(() => {
  const state = store.state
  return orderedVisibleWalletSymbols.value.map((crypto: CoinSymbol) => {
    const key = crypto.symbol.toLowerCase()
    const address = crypto.symbol === Cryptos.ADM ? state.address : state[key].address
    const balance = crypto.symbol === Cryptos.ADM ? state.balance : state[key].balance
    const erc20 = isErc20(crypto.symbol.toUpperCase() as CryptoSymbol)
    const currentRate = state.rate.rates[`${crypto.symbol}/${currentCurrency.value}`]
    const rate = currentRate !== undefined ? Number((balance * currentRate).toFixed(2)) : 0

    const cryptoName = CryptosInfo[crypto.symbol].nameShort || CryptosInfo[crypto.symbol].name

    return {
      address,
      balance,
      cryptoName,
      erc20,
      rate,
      cryptoCurrency: crypto.symbol
    }
  })
})

const areNodesDisabled = (crypto: CryptoSymbol) => {
  return crypto === 'ADM' ? allAdmNodesDisabled.value : allCoinNodesDisabled.value
}

const updateBalances = () => {
  if (allCoinNodesDisabled.value) {
    store.dispatch('snackbar/show', {
      message: t('home.no_active_nodes_pull_down', {
        coin: currentWallet.value
      })
    })
  }

  isRefreshing.value = true

  store
    .dispatch('updateBalance', {
      requestedByUser: true
    })
    .finally(() => {
      isRefreshing.value = false
    })

  vibrate.veryShort()
}

const goToTransactions = (crypto: string) => {
  router.push({
    name: 'Transactions',
    params: {
      crypto
    }
  })
}

const goToCoinNodes = (tab: Tab) => {
  store.commit('options/updateOption', {
    key: 'currentNodesTab',
    value: tab
  })

  router.push({
    name: 'Nodes'
  })
}

const handleBalanceClick = (crypto: string) => {
  const isAdm = crypto === 'ADM'

  const targetType = isAdm ? TABS.adm : TABS.coins
  const isDisabled = isAdm ? allAdmNodesDisabled.value : allCoinNodesDisabled.value

  if (isDisabled) {
    return goToCoinNodes(targetType)
  }

  goToTransactions(crypto)
}

const currentWallet = computed({
  get() {
    return store.state.options.currentWallet
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'currentWallet',
      value
    })
  }
})

watch(currentWallet, (value) => {
  if (route.name === 'Transactions' || route.name === 'Transaction') {
    goToTransactions(value)
  }

  if (route.name === 'SendFunds') {
    router.push({
      name: 'Home'
    })
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use 'sass:color';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

/**
 * 1. Reset VTabs container fixed height.
 * 2. Reset VTabItem opacity.
 */
.account-view {
  margin: 0;

  &__wallets {
    &.v-card {
      background-color: transparent;
    }
    :deep(.v-tabs-slider) {
      height: var(--a-account-tabs-slider-height);
    }
    :deep(.v-tabs) {
      padding-top: var(--a-account-tabs-padding-top);
      padding-bottom: var(--a-account-tabs-padding-bottom);
      margin-bottom: var(--a-account-tabs-margin-bottom);
    }
    :deep(.v-tab) {
      font-weight: var(--a-account-tab-font-weight);
      font-size: var(--a-account-tab-font-size);
      padding-block: var(--a-account-tab-padding-block);
      padding-inline: var(--a-account-tab-padding-inline);
      letter-spacing: var(--a-account-tab-letter-spacing);
      min-width: var(--a-account-tab-min-width);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :deep(.v-tab .v-btn__content) {
      align-items: center;
      justify-content: center;
    }
    :deep(.v-tab--selected) {
      font-weight: var(--a-account-tab-font-weight-selected);
    }
    :deep(.v-tab):not(.v-tab--selected) {
      opacity: 1;
    }
    :deep(.v-tabs.v-tabs.v-tabs .v-slide-group__prev.v-slide-group__prev--disabled) {
      visibility: hidden; // keep affix width so first tab stays centered
    }
    :deep(.v-tab.v-tab--selected::before) {
      background-color: unset;
    }
    :deep(.v-slide-group__prev) {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      flex-basis: var(--a-account-tab-affix-width);
      min-width: var(--a-account-tab-affix-width);
    }
    :deep(.v-slide-group__next) {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      flex-basis: var(--a-account-tab-affix-width);
      min-width: var(--a-account-tab-affix-width);
    }
    :deep(.v-slide-group__next.v-slide-group__next--disabled) {
      visibility: hidden; // keep affix width so last tab stays centered
    }
    :deep(.v-tabs .v-btn--stacked .v-btn__content) {
      line-height: normal;
    }
  }
  &__tabs {
    position: relative;
  }
  &__icon {
    margin-bottom: var(--a-account-tab-icon-offset);
  }
}

/** Themes **/
.v-theme--light {
  .account-view {
    &__wallets {
      :deep(.v-tabs-bar) {
        background-color: map.get(colors.$adm-colors, 'secondary2-transparent');
      }
      :deep(.v-tabs-slider) {
        background-color: map.get(colors.$adm-colors, 'primary');
      }
      :deep(.v-tab) {
        &:not(.v-tab--selected) {
          color: map.get(colors.$adm-colors, 'regular');
        }
      }
      :deep(.v-tabs .v-slide-group__prev .v-icon),
      :deep(.v-tabs .v-slide-group__next .v-icon) {
        z-index: 1;
        color: map.get(colors.$adm-colors, 'primary');
        border-radius: var(--a-radius-round);
        background-color: color.adjust(map.get(colors.$adm-colors, 'primary2'), $alpha: -0.7);
      }
      :deep(.v-tabs .v-slide-group__prev),
      :deep(.v-tabs .v-slide-group__next) {
        .v-icon:hover {
          background-color: color.adjust(map.get(colors.$adm-colors, 'primary2'), $alpha: -0.7);
        }
      }
      :deep(:not(.v-tab--selected)) {
        .svg-icon {
          fill: map.get(colors.$adm-colors, 'muted');
        }
      }
      :deep(.v-tab--selected) {
        color: map.get(colors.$adm-colors, 'primary');
        .svg-icon {
          fill: map.get(colors.$adm-colors, 'primary');
        }
      }
    }
  }
}

.v-theme--dark {
  .account-view {
    &__wallets {
      :deep(.v-tabs-bar) {
        background-color: transparent;
      }
      :deep(.v-tabs-slider) {
        background-color: map.get(colors.$adm-colors, 'primary');
      }
      :deep(.v-tabs .v-slide-group__prev .v-icon),
      :deep(.v-tabs .v-slide-group__next .v-icon) {
        z-index: 1;
        color: map.get(colors.$adm-colors, 'primary');
        border-radius: var(--a-radius-round);
        background-color: color.adjust(map.get(colors.$adm-colors, 'primary2'), $alpha: -0.7);
      }
      :deep(.v-tabs .v-slide-group__prev),
      :deep(.v-tabs .v-slide-group__next) {
        .v-icon:hover {
          background-color: color.adjust(map.get(colors.$adm-colors, 'primary2'), $alpha: -0.3);
        }
      }
      :deep(.v-tabs-items) {
        background-color: unset;
      }
      :deep(.v-tab) {
        &:not(.v-tab--selected) {
          color: map.get(settings.$shades, 'white');
        }
      }
      :deep(.v-tab--selected) {
        color: map.get(colors.$adm-colors, 'primary');
        .svg-icon {
          fill: map.get(colors.$adm-colors, 'primary');
        }
      }
    }
  }
}
</style>
