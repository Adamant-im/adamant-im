<template>
  <v-row
    justify="center"
    no-gutters
    :class="className"
  >
    <container>
      <v-sheet
        class="transparent white--text"
        :class="`${className}__card`"
      >
        <!-- Wallets -->
        <v-sheet
          :class="`${className}__wallets`"
        >
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
              <crypto-icon
                :crypto="wallet.cryptoCurrency"
                size="medium"
                :class="`${className}__icon`"
              />
              <div>
                <div>{{ wallet.balance | numberFormat(4) }}</div>
                <div>
                  {{ wallet.cryptoCurrency }}
                  <span
                    v-if="wallet.erc20"
                    style="font-size:10px"
                  >
                    <sub>ERC20</sub>
                  </span>
                </div>
                <div
                  v-if="$store.state.rate.isLoaded && wallet.rate"
                  class="a-text-explanation account-view__rates"
                >
                  {{ wallet.rate }} {{ currentCurrency }}
                </div>
              </div>
            </v-tab>
          </v-tabs>

          <v-window v-model="currentWallet">
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
                  <crypto-icon
                    :crypto="wallet.cryptoCurrency"
                    size="large"
                  />
                </template>
              </wallet-card>
            </v-window-item>
          </v-window>
        </v-sheet>
      </v-sheet>
    </container>
  </v-row>
</template>

<script>
import WalletCard from '@/components/WalletCard'
import CryptoIcon from '@/components/icons/CryptoIcon'
import numberFormat from '@/filters/numberFormat'

import { Cryptos, CryptosNames, isErc20 } from '@/lib/constants'

/**
 * Center VTab element on click.
 *
 * @override vuetify.VTabs.methods.scrollIntoView()
 */
function scrollIntoView () {
  if (!this.activeTab) return
  if (!this.isOverflowing) return (this.scrollOffset = 0)

  const totalWidth = this.widths.wrapper + this.scrollOffset
  const { clientWidth, offsetLeft } = this.activeTab.$el

  const scrollOffset = this.scrollOffset - (totalWidth - offsetLeft - clientWidth / 2 - this.widths.wrapper / 2)

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
    WalletCard,
    CryptoIcon
  },
  computed: {
    className: () => 'account-view',
    wallets () {
      return Object.keys(Cryptos).map(crypto => {
        const state = this.$store.state
        const key = crypto.toLowerCase()
        const address = crypto === Cryptos.ADM ? state.address : state[key].address
        const balance = crypto === Cryptos.ADM ? state.balance : state[key].balance
        const erc20 = isErc20(crypto.toUpperCase())
        const currentRate = state.rate.rates[`${crypto}/${this.currentCurrency}`]
        const rate = currentRate !== undefined ? Number((balance * currentRate).toFixed(2)) : 0
        return {
          address,
          balance,
          cryptoCurrency: crypto,
          cryptoName: CryptosNames[crypto],
          erc20,
          rate
        }
      })
    },
    currentWallet: {
      get () {
        return this.$store.state.options.currentWallet
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'currentWallet',
          value
        })
      }
    },
    currentCurrency: {
      get () {
        return this.$store.state.options.currentRate
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'currentRate',
          value
        })
      }
    }
  },
  mounted () {
    this.$refs.vtabs.scrollIntoView = scrollIntoView
  },
  methods: {
    goToTransactions (crypto) {
      this.$router.push({
        name: 'Transactions',
        params: {
          crypto
        }
      })
    },
    onWheel (e) {
      const currentWallet = this.wallets.find(wallet => wallet.cryptoCurrency === this.currentWallet)
      const currentWalletIndex = this.wallets.indexOf(currentWallet)

      const nextWalletIndex = e.deltaY < 0 ? currentWalletIndex + 1 : currentWalletIndex - 1
      const nextWallet = this.wallets[nextWalletIndex]

      if (nextWallet) this.currentWallet = nextWallet.cryptoCurrency
    },
    numberFormat
  }
}
</script>

<style lang="scss" scoped>
@import '~vuetify/settings';
@import '../assets/styles/settings/_colors.scss';

/**
 * 1. Reset VTabs container fixed height.
 * 2. Reset VTabItem opacity.
 */
.account-view {
  &__rates {
    margin-top: 2px;
    color: hsla(0, 0%, 100%, 0.7);
  }
  &__wallets {
    &.v-card {
      background-color: transparent;
    }
    :deep(.v-tabs-slider) {
      height: 2px;
    }
    :deep(.v-slide-group__wrapper) {
      padding: 10px 0 1px 0;
      margin-bottom: 10px;
    }
    :deep(.v-tab) {
      font-weight: 300;
      font-size: 16px;
      padding: 6px 4px;
      letter-spacing: normal;
      min-width: 74px;
      align-items: flex-start;
    }
    :deep(.v-tab--active) {
      font-weight: 500;
    }
    :deep(.v-tab):not(.v-tab--active)  {
      opacity: 1;
    }
    :deep(.v-tabs.v-tabs.v-tabs .v-slide-group__prev.v-slide-group__prev--disabled) {
      display: none; // workaround: hide left/right arrows
    }
    :deep(.v-tab.v-tab--active::before) {
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
    &__rates  {
      color: map-get($adm-colors, 'muted');
    }
    &__wallets {
      :deep(.v-tabs-bar) {
        background-color: map-get($adm-colors, 'secondary2-transparent');
      }
      :deep(.v-tabs-slider) {
        background-color: map-get($adm-colors, 'primary') !important;
      }
      :deep(.v-tab) {
        &:not(.v-tab--active) {
          color: map-get($adm-colors, 'regular');
        }
      }
      :deep(.v-tabs .v-slide-group__prev .v-icon), :deep(.v-tabs .v-slide-group__next .v-icon) {
        color: map-get($adm-colors, 'primary2');
        pointer-events: none;
      }
      :deep(.v-tab--active) {
        color: map-get($adm-colors, 'primary');
        .svg-icon {
          fill: map-get($adm-colors, 'primary');
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
        background-color: map-get($adm-colors, 'primary') !important;
      }
      :deep(.v-tabs .v-slide-group__prev .v-icon), :deep(.v-tabs .v-slide-group__next .v-icon) {
        color: map-get($adm-colors, 'primary2');
        pointer-events: none;
      }
      :deep(.v-tabs-items) {
        background-color: unset;
      }
      :deep(.v-tab) {
        &:not(.v-tab--selected) {
          color: map-get($shades, 'white')
        }
      }
      :deep(.v-tab--selected) {
        color: map-get($adm-colors, 'primary');
        .svg-icon {
          fill: map-get($adm-colors, 'primary');
        }
      }
    }
  }
}

.v-tab--selected {
  .account-view__rates {
    color: inherit;
  }
}
</style>
