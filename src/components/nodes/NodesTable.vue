<template>
  <SettingsTableShell :class="classes.root">
    <v-tabs v-model="tab" bg-color="transparent">
      <v-tab value="adm">{{ t('nodes.tabs.adm_nodes') }}</v-tab>
      <v-tab value="coins">{{ t('nodes.tabs.coin_nodes') }}</v-tab>
      <v-tab value="services">{{ t('nodes.tabs.service_nodes') }}</v-tab>
      <v-tab value="ipfs">{{ t('nodes.tabs.ipfs_nodes') }}</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="adm">
        <AdmNodesTable />
      </v-window-item>
      <v-window-item value="coins">
        <CoinNodesTable />
      </v-window-item>
      <v-window-item value="services">
        <ServiceNodesTable />
      </v-window-item>

      <v-window-item value="ipfs">
        <IpfsNodesTable />
      </v-window-item>
    </v-window>

    <template #after>
      <div v-if="tab === 'coins' || tab === 'ipfs'">
        <v-checkbox
          v-model="preferFastestCoinNodeOption"
          :label="t('nodes.fastest_title')"
          :class="[classes.checkbox, classes.checkboxSection]"
          color="grey darken-1"
          hide-details
        />
        <div :class="classes.description">
          {{ t('nodes.fastest_tooltip') }}
        </div>
        <div>&nbsp;<br />&nbsp;</div>
      </div>
      <div v-else-if="tab === 'services'">
        <v-checkbox
          v-model="preferFasterServiceNodeOption"
          :label="t('nodes.fastest_title')"
          :class="[classes.checkbox, classes.checkboxSection]"
          color="grey darken-1"
          hide-details
        />
        <div :class="classes.description">
          {{ t('nodes.fastest_tooltip') }}
        </div>
        <div>&nbsp;<br />&nbsp;</div>
      </div>
      <div v-else-if="tab === 'adm'">
        <v-checkbox
          v-model="preferFastestAdmNodeOption"
          :label="t('nodes.fastest_title')"
          :class="[classes.checkbox, classes.checkboxSection]"
          color="grey darken-1"
          hide-details
        />
        <div :class="classes.description">
          {{ t('nodes.fastest_tooltip') }}
        </div>
        <v-checkbox
          v-model="useSocketConnection"
          :label="t('nodes.use_socket_connection')"
          :class="[classes.checkbox, classes.checkboxSection]"
          color="grey darken-1"
          hide-details
        />
        <div :class="classes.description">
          {{ t('nodes.use_socket_connection_tooltip') }}
        </div>

        <!-- eslint-disable vue/no-v-html -- Safe internal content -->
        <div :class="classes.info" v-html="t('nodes.nodeLabelDescription')" />
        <!-- eslint-enable vue/no-v-html -->

        <div>&nbsp;<br />&nbsp;</div>
      </div>
    </template>
  </SettingsTableShell>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { AdmNodesTable } from './adm'
import { CoinNodesTable } from './coins'
import { ServiceNodesTable } from './services'
import { IpfsNodesTable } from './ipfs'
import { Tab } from '@/components/nodes/types'
import SettingsTableShell from '@/components/common/SettingsTableShell.vue'

const className = 'nodes-table'
const classes = {
  root: className,
  info: `${className}__info`,
  checkbox: `${className}__checkbox`,
  checkboxSection: `${className}__checkbox-section`,
  description: `${className}__description`
}

const { t } = useI18n()
const store = useStore()
const tab = computed<Tab>({
  get() {
    return store.getters['options/currentNodesTab']
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'currentNodesTab',
      value
    })
  }
})

const useSocketConnection = computed<boolean>({
  get() {
    return store.state.options.useSocketConnection
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'useSocketConnection',
      value
    })
  }
})
const preferFastestAdmNodeOption = computed<boolean>({
  get() {
    return store.state.nodes.useFastestAdmNode
  },
  set(value) {
    store.dispatch('nodes/setUseFastestAdmNode', value)
  }
})

const preferFastestCoinNodeOption = computed<boolean>({
  get() {
    return store.state.nodes.useFastestCoinNode
  },
  set(value) {
    store.dispatch('nodes/setUseFastestCoinNode', value)
  }
})

const preferFasterServiceNodeOption = computed<boolean>({
  get() {
    return store.state.services.useFastestService
  },
  set(value) {
    store.dispatch('services/useFastestService', value)
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/components/_text-content.scss' as textContent;
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.nodes-table {
  --a-nodes-tab-letter-spacing: var(--a-letter-spacing-caps-small);

  &__checkbox-section {
    margin-top: var(--a-space-4);
  }

  &__description {
    @include textContent.a-content-explanatory-copy();
    margin-top: var(--a-space-2);
  }

  &__info {
    @include textContent.a-content-explanatory-copy();
    @include textContent.a-content-inline-links();
  }

  :deep(.v-tab) {
    text-transform: uppercase;
    letter-spacing: var(--a-nodes-tab-letter-spacing);
  }
}
/** Themes **/
.v-theme--light {
  .nodes-table {
    &__checkbox {
      :deep(.v-label) {
        color: map.get(colors.$adm-colors, 'regular');
      }
      :deep(.v-selection-control__input .v-icon),
      :deep(.v-selection-control__input input) {
        color: map.get(colors.$adm-colors, 'regular');
        caret-color: map.get(colors.$adm-colors, 'regular');
      }
    }
  }
}
</style>
