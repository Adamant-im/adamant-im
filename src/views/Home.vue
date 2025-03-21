<template>
  <pull-down @action="updateBalances" :action-text="$t('chats.pull_down_actions.update_balances')">
    <v-row justify="center" no-gutters :class="className">
      <container>
        <v-sheet class="white--text" color="transparent" :class="`${className}__card`">
          <!-- Wallets -->
          <v-sheet color="transparent" :class="`${className}__wallets`">
            <v-tabs
              ref="vtabs"
              v-model="currentWallet"
              :class="`${className}__tabs`"
              grow
              stacked
              height="auto"
              show-arrows
            >
              <v-tab
                v-for="wallet in wallets"
                :key="wallet.cryptoCurrency"
                :value="wallet.cryptoCurrency"
                @wheel="onWheel"
              >
                <wallet-tab :wallet="wallet" :fiat-currency="currentCurrency" />
              </v-tab>
            </v-tabs>

            <v-progress-circular
              :class="`ml-3`"
              v-show="!isOnline"
              indeterminate
              color="secondary"
              size="30"
              style="z-index: 100"
            />

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
                  :balance="wallet.balance"
                  :crypto="wallet.cryptoCurrency"
                  :crypto-name="wallet.cryptoName"
                  :rate="wallet.rate"
                  :current-currency="currentCurrency"
                  @click:balance="goToTransactions"
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

<script>
import WalletCard from '@/components/WalletCard.vue'
import WalletTab from '@/components/WalletTab.vue'
import CryptoIcon from '@/components/icons/CryptoIcon.vue'
import numberFormat from '@/filters/numberFormat'

import { PullDown } from '@/components/common/PullDown'
import { Cryptos, CryptosInfo, isErc20 } from '@/lib/constants'

/**
 * Center VTab element on click.
 *
 * @override vuetify.VTabs.methods.scrollIntoView()
 */
function scrollIntoView() {
  if (!this.activeTab) return
  if (!this.isOverflowing) return (this.scrollOffset = 0)

  const totalWidth = this.widths.wrapper + this.scrollOffset
  const { clientWidth, offsetLeft } = this.activeTab.$el

  const scrollOffset =
    this.scrollOffset - (totalWidth - offsetLeft - clientWidth / 2 - this.widths.wrapper / 2)

  if (scrollOffset <= 0) {
    this.scrollOffset = 0
  } else if (scrollOffset >= this.widths.container - this.widths.wrapper) {
    this.scrollOffset = this.widths.container - this.widths.wrapper
  } else {
    this.scrollOffset = scrollOffset
  }
}

export default {
  components: {
    PullDown,
    WalletCard,
    WalletTab,
    CryptoIcon
  },
  computed: {
    className: () => 'account-view',
    isOnline() {
      return this.$store.getters['isOnline']
    },
    orderedVisibleWalletSymbols() {
      return this.$store.getters['wallets/getVisibleOrderedWalletSymbols']
    },
    wallets() {
      const state = this.$store.state

      return this.orderedVisibleWalletSymbols.map((crypto) => {
        const key = crypto.symbol.toLowerCase()
        const address = crypto.symbol === Cryptos.ADM ? state.address : state[key].address
        const balance = crypto.symbol === Cryptos.ADM ? state.balance : state[key].balance
        const erc20 = isErc20(crypto.symbol.toUpperCase())
        const currentRate = state.rate.rates[`${crypto.symbol}/${this.currentCurrency}`]
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
    },
    currentWallet: {
      get() {
        return this.$store.state.options.currentWallet
      },
      set(value) {
        this.$store.commit('options/updateOption', {
          key: 'currentWallet',
          value
        })
      }
    },
    currentCurrency: {
      get() {
        return this.$store.state.options.currentRate
      },
      set(value) {
        this.$store.commit('options/updateOption', {
          key: 'currentRate',
          value
        })
      }
    }
  },
  mounted() {
    this.$refs.vtabs.scrollIntoView = scrollIntoView
  },
  methods: {
    goToTransactions(crypto) {
      this.$router.push({
        name: 'Transactions',
        params: {
          crypto
        }
      })
    },
    onWheel(e) {
      const currentWallet = this.wallets.find(
        (wallet) => wallet.cryptoCurrency === this.currentWallet
      )
      const currentWalletIndex = this.wallets.indexOf(currentWallet)

      const nextWalletIndex = e.deltaY < 0 ? currentWalletIndex + 1 : currentWalletIndex - 1
      const nextWallet = this.wallets[nextWalletIndex]

      if (nextWallet) this.currentWallet = nextWallet.cryptoCurrency
    },
    updateBalances() {
      this.$store.dispatch('updateBalance', {
        requestedByUser: true
      })
    },
    numberFormat
  }
}
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
  &__wallets {
    &.v-card {
      background-color: transparent;
    }
    :deep(.v-tabs-slider) {
      height: 2px;
    }
    :deep(.v-tabs) {
      padding: 10px 0 1px 0;
      margin-bottom: 10px;
    }
    :deep(.v-tab) {
      font-weight: 300;
      font-size: 16px;
      padding: 6px 4px;
      letter-spacing: normal;
      min-width: 74px;
      display: flex;
      align-items: flex-start;
    }
    :deep(.v-tab--selected) {
      font-weight: 500;
    }
    :deep(.v-tab):not(.v-tab--selected) {
      opacity: 1;
    }
    :deep(.v-tabs.v-tabs.v-tabs .v-slide-group__prev.v-slide-group__prev--disabled) {
      display: none; // workaround: hide left/right arrows
    }
    :deep(.v-tab.v-tab--selected::before) {
      background-color: unset;
    }
    :deep(.v-slide-group__prev) {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      flex-basis: 32px;
      min-width: 32px;
    }
    :deep(.v-slide-group__next) {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      flex-basis: 32px;
      min-width: 32px;
    }
    :deep(.v-slide-group__next.v-slide-group__next--disabled) {
      display: none;
    }
    :deep(.v-tabs .v-btn--stacked .v-btn__content) {
      line-height: normal;
    }
  }
  &__tabs {
    position: relative;
  }
  &__icon {
    margin-bottom: 3px;
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
        background-color: map.get(colors.$adm-colors, 'primary') !important;
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
        border-radius: 50%;
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
        background-color: map.get(colors.$adm-colors, 'primary') !important;
      }
      :deep(.v-tabs .v-slide-group__prev .v-icon),
      :deep(.v-tabs .v-slide-group__next .v-icon) {
        z-index: 1;
        color: map.get(colors.$adm-colors, 'primary');
        border-radius: 50%;
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
