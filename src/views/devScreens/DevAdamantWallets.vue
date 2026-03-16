<template>
  <v-row gap="0">
    <v-col cols="12">
      <div :class="classes.section">
        <h4 :class="classes.sectionTitle">{{ t('dev_wallets.configuration') }}</h4>

        <v-row gap="0">
          <v-col cols="12" md="4" :class="classes.fieldColumn">
            <v-autocomplete
              v-model="selectedCoin"
              :items="coinOptions"
              :label="t('dev_wallets.select_coin')"
              item-title="label"
              item-value="value"
              variant="outlined"
              clearable
              :menu-props="mobileMenuProps"
              @update:modelValue="onCoinChange"
            />
          </v-col>

          <v-col cols="12" md="4" :class="classes.fieldColumn">
            <v-autocomplete
              v-model="selectedBlockchain"
              :items="blockchainOptions"
              :label="t('dev_wallets.select_blockchain')"
              :disabled="!selectedCoin"
              item-title="label"
              item-value="value"
              variant="outlined"
              clearable
              :menu-props="mobileMenuProps"
              autocomplete="off"
              @update:modelValue="onBlockchainChange"
            />
          </v-col>

          <v-col cols="12" md="4" :class="[classes.fieldColumn, classes.fieldColumnLast]">
            <v-autocomplete
              v-model="selectedProperty"
              :items="propertyOptions"
              :label="t('dev_wallets.select_property')"
              :disabled="!selectedBlockchain"
              item-title="label"
              item-value="value"
              variant="outlined"
              clearable
              :menu-props="mobileMenuProps"
              autocomplete="off"
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
  fieldColumn: `${className}__field-column`,
  fieldColumnLast: `${className}__field-column--last`,
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
    return []
  }

  const coin = CryptosInfo[selectedCoin.value]
  if (!coin) {
    return []
  }

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
  if (!coin) {
    return null
  }

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

const mobileMenuProps = computed(() => {
  if (window.innerWidth < 768) {
    return {
      maxHeight: 'var(--a-dev-screen-mobile-menu-max-height)'
    }
  }
  return {}
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.dev-wallets-view {
  &__section {
    margin-bottom: var(--a-dev-screen-section-gap);
  }

  &__section-title {
    @include mixins.a-text-regular-enlarged();
    margin-bottom: var(--a-dev-screen-section-title-gap);
    padding-bottom: var(--a-dev-screen-section-title-padding-bottom);
    border-bottom: var(--a-border-width-thin) solid;
  }

  &__field-column {
    margin-bottom: var(--a-space-3);
    padding-inline-end: 0;

    @media #{map.get(settings.$display-breakpoints, 'md-and-up')} {
      padding-inline-end: var(--a-space-2);
    }
  }

  &__field-column--last {
    @media #{map.get(settings.$display-breakpoints, 'md-and-up')} {
      padding-inline-end: 0;
    }
  }

  &__result-container {
    max-width: 100%;
  }

  &__result-card {
    width: 100%;

    :deep(.v-card-title) {
      padding-bottom: var(--a-dev-screen-card-title-padding-bottom);
      word-break: break-word;
    }

    :deep(.v-card-text) {
      padding-top: var(--a-dev-screen-card-text-padding-top);
      max-height: var(--a-dev-screen-card-text-max-height);
      overflow-y: auto;
    }
  }

  &__json-output {
    background: transparent;
    font-family: 'Courier New', monospace;
    font-size: var(--a-dev-screen-code-font-size);
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    padding: var(--a-dev-screen-code-padding);
    border-radius: var(--a-dev-screen-code-border-radius);
    border: var(--a-border-width-thin) solid;
    max-height: var(--a-dev-screen-code-max-height);
    overflow-y: auto;

    @media #{map.get(settings.$display-breakpoints, 'md-and-down')} {
      font-size: var(--a-dev-screen-code-font-size-md);
    }

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      font-size: var(--a-dev-screen-code-font-size-sm);
      padding: var(--a-dev-screen-code-padding-mobile);
    }
  }

  // Remove blue droplet (ripple effect) when clicking on v-autocomplete
  :deep(.v-autocomplete) {
    .v-ripple__container,
    .v-field__overlay,
    .v-overlay {
      display: none;
    }
  }
}

/** Themes **/
.v-theme--light {
  .dev-wallets-view {
    &__section-title {
      color: map.get(colors.$adm-colors, 'regular');
      border-color: var(--a-color-border-soft-light);
    }

    &__json-output {
      background-color: var(--a-color-surface-soft-light);
      border-color: var(--a-color-border-soft-light);
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
</style>
