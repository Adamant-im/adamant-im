<template>
  <v-row no-gutters>
    <v-col cols="12">
      <div :class="classes.section">
        <h4 :class="classes.sectionTitle">{{ t('dev_wallets.configuration') }}</h4>

        <v-row no-gutters>
          <v-col cols="12" md="4" class="pr-0 pr-md-2 mb-3">
            <v-select
              v-model="selectedCoin"
              :items="coinOptions"
              :label="t('dev_wallets.select_coin')"
              item-title="label"
              item-value="value"
              variant="outlined"
              @update:modelValue="onCoinChange"
            />
          </v-col>

          <v-col cols="12" md="4" class="pr-0 pr-md-2 mb-3">
            <v-select
              v-model="selectedBlockchain"
              :items="blockchainOptions"
              :label="t('dev_wallets.select_blockchain')"
              :disabled="!selectedCoin"
              item-title="label"
              item-value="value"
              variant="outlined"
              @update:modelValue="onBlockchainChange"
            />
          </v-col>

          <v-col cols="12" md="4" class="mb-3">
            <v-select
              v-model="selectedProperty"
              :items="propertyOptions"
              :label="t('dev_wallets.select_property')"
              :disabled="!selectedBlockchain"
              item-title="label"
              item-value="value"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </div>

      <div v-if="selectedProperty" :class="classes.section">
        <h4 :class="classes.sectionTitle">{{ t('dev_wallets.result') }}</h4>
        <div :class="classes.resultContainer">
          <v-card :class="classes.resultCard" variant="outlined">
            <v-card-title>
              <strong>{{ selectedCoin }}.{{ selectedBlockchain }}.{{ selectedProperty }}</strong>
            </v-card-title>
            <v-card-text>
              <pre :class="classes.jsonOutput">{{ JSON.stringify(currentValue, null, 2) }}</pre>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" @click="copyValue" :prepend-icon="mdiContentCopy">
                {{ t('dev_wallets.copy_value') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { mdiContentCopy } from '@mdi/js'
import { useI18n } from 'vue-i18n'

import { AllCryptosOrder, CryptosInfo, type CryptoSymbol } from '@/lib/constants/cryptos'
import type { TokenGeneral } from '@/types/wallets'
import copyToClipboard from 'copy-to-clipboard'
import { useStore } from 'vuex'

const { t } = useI18n()
const store = useStore()

const className = 'dev-wallets-view'
const classes = {
  section: `${className}__section`,
  sectionTitle: `${className}__section-title`,
  resultContainer: `${className}__result-container`,
  resultCard: `${className}__result-card`,
  jsonOutput: `${className}__json-output`
}

const selectedCoin = ref<CryptoSymbol | null>(null)
const selectedBlockchain = ref<'main' | keyof TokenGeneral | null>(null)
const selectedProperty = ref<string | null>(null)

const coinOptions = computed(() => {
  return AllCryptosOrder.map((symbol) => ({
    label: `${symbol} (${CryptosInfo[symbol].name})`,
    value: symbol
  }))
})

const blockchainOptions = computed(() => {
  if (!selectedCoin.value) {
    return
  }

  const coin = CryptosInfo[selectedCoin.value]
  const options = [{ label: 'Main Properties', value: 'main' }]

  const additionalContexts: Array<{ key: keyof TokenGeneral; label: string }> = [
    { key: 'nodes', label: 'Nodes' },
    { key: 'services', label: 'Services' },
    { key: 'testnet', label: 'Testnet' },
    { key: 'tor', label: 'Tor' },
    { key: 'links', label: 'Links' }
  ]

  additionalContexts.forEach(({ key, label }) => {
    if (coin[key]) {
      options.push({ label, value: key })
    }
  })

  return options
})

const targetObject = computed(() => {
  if (!selectedCoin.value || !selectedBlockchain.value) {
    return null
  }

  const coin = CryptosInfo[selectedCoin.value]
  const target = selectedBlockchain.value === 'main' ? coin : coin[selectedBlockchain.value]

  return target
})

const propertyOptions = computed(() => {
  if (!targetObject.value) {
    return []
  }

  return Object.keys(targetObject.value)
    .map((key) => ({ label: key, value: key }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const currentValue = computed(() => {
  if (!targetObject.value || !selectedProperty.value) {
    return null
  }

  return targetObject.value[selectedProperty.value as keyof typeof targetObject.value] ?? null
})

const onCoinChange = () => {
  selectedBlockchain.value = null
  selectedProperty.value = null
}

const onBlockchainChange = () => {
  selectedProperty.value = null
}

const copyValue = () => {
  copyToClipboard(JSON.stringify(currentValue.value, null, 2))
  store.dispatch('snackbar/show', { message: t('home.copied'), timeout: 2000 })
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.dev-wallets-view {
  &__section {
    margin-bottom: 32px;
  }

  &__section-title {
    @include mixins.a-text-regular-enlarged();
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid;
  }

  &__result-container {
    max-width: 100%;
  }

  &__result-card {
    width: 100%;

    :deep(.v-card-title) {
      padding-bottom: 8px;
      word-break: break-word;
    }

    :deep(.v-card-text) {
      padding-top: 8px;
      max-height: 400px;
      overflow-y: auto;
    }
  }

  &__json-output {
    background: transparent;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid;
    max-height: 300px;
    overflow-y: auto;
  }
}

/** Themes **/
.v-theme--light {
  .dev-wallets-view {
    &__section-title {
      color: map.get(colors.$adm-colors, 'regular');
      border-color: map.get(colors.$adm-colors, 'secondary2');
    }

    &__json-output {
      background-color: map.get(colors.$adm-colors, 'secondary2-transparent');
      border-color: map.get(colors.$adm-colors, 'secondary2');
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .dev-wallets-view {
    &__json-output {
      background-color: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.87);
    }
  }
}

/** Breakpoints **/
@media #{map.get(settings.$display-breakpoints, 'md-and-down')} {
  .dev-wallets-view {
    &__json-output {
      font-size: 11px;
    }
  }
}

@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .dev-wallets-view {
    &__json-output {
      font-size: 10px;
      padding: 8px;
    }
  }
}
</style>
