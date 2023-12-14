<template>
  <div :class="classes.root">
    <app-toolbar-centered app :title="$t('options.wallets_list')" :show-back="true" flat fixed />

    <v-container fluid class="px-0 container--with-app-toolbar">
      <v-row justify="center" no-gutters>
        <container padding>
          <WalletsSearchInput @change="searchChanged"></WalletsSearchInput>
          <v-list lines="two">
            <draggable
              class="list-group"
              v-model="filteredWallets"
              v-bind="dragOptions"
              handle=".handle"
              @start="isDragging = true"
              @end="isDragging = false"
              item-key="cryptoName"
            >
              <template #item="{ element }">
                <WalletsListItem :wallet="element"></WalletsListItem>
              </template>
            </draggable>
            <v-list-item>
              <WalletResetDialog></WalletResetDialog>
            </v-list-item>
          </v-list>
        </container>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import draggable from 'vuedraggable'
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import { computed, defineComponent, ref, watch } from 'vue'
import { Cryptos, CryptosInfo, CryptoSymbol, isErc20 } from '@/lib/constants'
import { useStore } from 'vuex'
import WalletsSearchInput from '@/components/wallets/WalletsSearchInput.vue'
import WalletsListItem from '@/components/wallets/WalletsListItem.vue'
import WalletResetDialog from '@/components/wallets/WalletResetDialog.vue'

const className = 'wallets-view'
const classes = {
  root: className
}

type OrderedWalletSymbol = {
  isVisible: boolean
  symbol: CryptoSymbol
}

export default defineComponent({
  components: {
    WalletResetDialog,
    WalletsListItem,
    WalletsSearchInput,
    AppToolbarCentered,
    draggable
  },
  setup() {
    const store = useStore()

    const isDragging = ref(false)
    const search = ref('')
    const wallets = ref([])
    const dragOptions = computed(() => {
      return {
        animation: 200,
        disabled: false,
        ghostClass: 'ghost',
        group: 'description'
      }
    })

    const currentFiatCurrency = computed({
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

    const orderedAllWalletSymbols = computed(() => {
      return store.getters.getAllOrderedWalletSymbols
    })

    const searchChanged = (value: string | Event) => {
      if (value instanceof Event) return
      search.value = value
    }

    const filteredWallets = computed({
      get() {
        return wallets.value.filter((wallet) => {
          return (
            wallet.cryptoName.toLowerCase().includes(search.value.toLowerCase()) ||
            wallet.symbol.toLowerCase().includes(search.value.toLowerCase())
          )
        })
      },
      set(value) {
        wallets.value = value
      }
    })

    const mapWallets = () => {
      wallets.value = orderedAllWalletSymbols.value.map((crypto: OrderedWalletSymbol) => {
        const symbol = crypto.symbol
        const key = symbol.toLowerCase()
        const balance =
          symbol === Cryptos.ADM
            ? store.state.balance
            : store.state[key]
              ? store.state[key].balance
              : 0
        const erc20 = isErc20(symbol)
        const cryptoName = CryptosInfo[symbol].nameShort || CryptosInfo[symbol].name
        const currentRate = store.state.rate.rates[`${symbol}/${currentFiatCurrency.value}`]
        const isVisible = crypto.isVisible
        const rate = currentRate !== undefined ? Number((balance * currentRate).toFixed(2)) : 0

        const type = CryptosInfo[symbol].type ?? 'Blockchain'

        return {
          balance,
          cryptoName,
          erc20,
          isVisible,
          rate,
          symbol,
          type
        }
      })
    }

    mapWallets()

    watch(
      () => wallets.value,
      (newValue) => {
        const newOrder = newValue.map((wallet: OrderedWalletSymbol) => {
          const isVisible = wallet.isVisible
          const symbol = wallet.symbol

          return { isVisible, symbol }
        })

        store.dispatch('setWalletsTemplates', newOrder, { root: true })
      },
      { deep: true }
    )

    watch(
      () => orderedAllWalletSymbols.value,
      () => mapWallets(),
      { deep: true }
    )

    return {
      classes,
      dragOptions,
      filteredWallets,
      isDragging,
      search,
      searchChanged,
      orderedAllWalletSymbols,
      wallets
    }
  }
})
</script>

<style lang="scss" scoped></style>
