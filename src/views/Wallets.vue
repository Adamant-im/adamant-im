<template>
  <div :class="classes.root">
    <app-toolbar-centered app :title="$t('options.wallets_list')" :show-back="true" flat fixed />

    <v-container fluid class="px-0 container--with-app-toolbar">
      <v-row justify="center" no-gutters>
        <container padding>
          <v-list lines="two">
            <draggable
              class="list-group"
              :component-data="{
                tag: 'ul',
                type: 'transition-group',
                name: !isDragging ? 'flip-list' : null
              }"
              v-model="wallets"
              v-bind="dragOptions"
              @start="isDragging = true"
              @end="isDragging = false"
              item-key="cryptoName"
            >
              <template #item="{ element }">
                <v-list-item :title="element.cryptoName">
                  <v-list-item-subtitle>
                    <p>
                      {{ element.type }} <b>{{ element.symbol }}</b>
                    </p>
                  </v-list-item-subtitle>
                  <template v-slot:prepend>
                    <v-avatar>
                      <crypto-icon
                        :class="classes.cryptoIcon"
                        :crypto="element.cryptoCurrency"
                        size="medium"
                      />
                    </v-avatar>
                  </template>

                  <template v-slot:append>
                    <v-checkbox hide-details></v-checkbox>
                    <v-btn
                      color="grey-lighten-1"
                      class="handle"
                      icon="mdi-menu"
                      variant="text"
                    ></v-btn>
                  </template>
                </v-list-item>
              </template>
            </draggable>
          </v-list>
        </container>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import draggable from 'vuedraggable'
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import { computed, defineComponent, reactive, ref } from 'vue'
import { CryptosInfo, CryptosOrder, isErc20 } from '@/lib/constants'
import CryptoIcon from '@/components/icons/CryptoIcon.vue'

const className = 'wallets-view'
const classes = {
  root: className,
  cryptoIcon: `${className}__crypto-icon`
}

// TODO
type Wallet = {
  address?: string
  balance?: number
  cryptoCurrency: string
  cryptoName: string
  erc20: boolean
  hasBalanceLoaded?: boolean
  isBalanceLoading?: boolean
  rate?: number
  symbol: string
  type: string
}

export default defineComponent({
  components: {
    AppToolbarCentered,
    CryptoIcon,
    draggable
  },
  beforeMount() {
    this.wallets = CryptosOrder.map((crypto) => {
      const erc20 = isErc20(crypto.toUpperCase())
      const cryptoName = CryptosInfo[crypto].nameShort || CryptosInfo[crypto].name
      const symbol = CryptosInfo[crypto].symbol
      const type = CryptosInfo[crypto].type ?? 'Blockchain'

      return {
        cryptoName,
        erc20,
        cryptoCurrency: crypto,
        symbol,
        type
      }
    })
  },
  setup() {
    const isDragging = ref(false)
    const wallets = reactive<Array<Wallet>>([])
    const dragOptions = computed(() => {
      return {
        animation: 200,
        disabled: false,
        ghostClass: 'ghost',
        group: 'description'
      }
    })

    return {
      classes,
      dragOptions,
      isDragging,
      wallets
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/themes/adamant/_mixins.scss';
@import 'vuetify/settings';
@import '@/assets/styles/settings/_colors.scss';

.wallets-view {
  &__info {
    :deep(a) {
      text-decoration-line: none;
      &:hover {
        text-decoration-line: underline;
      }
    }
  }
  :deep(.v-input--selection-controls:not(.v-input--hide-details)) .v-input__slot {
    margin-bottom: 0;
  }

  :deep(.v-checkbox) {
    margin-left: -8px;
  }

  :deep(.sortable-chosen) {
    background: #2e7eed; //TODO: temp style
  }
}

/** Themes **/
.v-theme--light {
  .wallets-view {
    &__checkbox {
      :deep(.v-label) {
        color: map-get($adm-colors, 'regular');
      }
      :deep(.v-input--selection-controls__ripple),
      :deep(.v-input--selection-controls__input) i {
        color: map-get($adm-colors, 'regular') !important;
        caret-color: map-get($adm-colors, 'regular') !important;
      }
    }
  }
}
</style>
