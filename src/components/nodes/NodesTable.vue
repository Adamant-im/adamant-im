<template>
  <div :class="classes.root">
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
    <div class="ml-6">
      <div v-if="tab === 'coins' || tab === 'ipfs'">
        <v-checkbox
          v-model="preferFastestCoinNodeOption"
          :label="t('nodes.fastest_title')"
          :class="classes.checkbox"
          class="mt-4"
          color="grey darken-1"
          hide-details
        />
        <div class="a-text-explanation-enlarged">
          {{ t('nodes.fastest_tooltip') }}
        </div>
        <div>&nbsp;<br />&nbsp;</div>
      </div>
      <div v-else-if="tab === 'services'">
        <v-checkbox
          v-model="preferFasterServiceNodeOption"
          :label="t('nodes.fastest_title')"
          :class="classes.checkbox"
          class="mt-4"
          color="grey darken-1"
          hide-details
        />
        <div class="a-text-explanation-enlarged">
          {{ t('nodes.fastest_tooltip') }}
        </div>
        <div>&nbsp;<br />&nbsp;</div>
      </div>
      <div v-else-if="tab === 'adm'">
        <v-checkbox
          v-model="preferFastestAdmNodeOption"
          :label="t('nodes.fastest_title')"
          :class="classes.checkbox"
          class="mt-4"
          color="grey darken-1"
          hide-details
        />
        <div class="a-text-explanation-enlarged">
          {{ t('nodes.fastest_tooltip') }}
        </div>
        <v-checkbox
          v-model="useSocketConnection"
          :label="t('nodes.use_socket_connection')"
          :class="classes.checkbox"
          class="mt-4"
          color="grey darken-1"
          hide-details
        />
        <div class="a-text-explanation-enlarged">
          {{ t('nodes.use_socket_connection_tooltip') }}
        </div>

        <!-- eslint-disable vue/no-v-html -- Safe internal content -->
        <div
          :class="classes.info"
          class="a-text-regular-enlarged mt-6"
          v-html="t('nodes.nodeLabelDescription')"
        />
        <!-- eslint-enable vue/no-v-html -->

        <div>&nbsp;<br />&nbsp;</div>
      </div>
    </div>
  </div>
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

const className = 'nodes-table'
const classes = {
  root: className,
  info: `${className}__info`,
  checkbox: `${className}__checkbox`
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
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.nodes-table {
  margin-left: -24px;
  margin-right: -24px;

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
}

@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .nodes-table {
    margin-left: -16px;
    margin-right: -16px;
  }
}
/** Themes **/
.v-theme--light {
  .nodes-table {
    &__checkbox {
      :deep(.v-label) {
        color: map.get(colors.$adm-colors, 'regular');
      }
      :deep(.v-input--selection-controls__ripple),
      :deep(.v-input--selection-controls__input) i {
        color: map.get(colors.$adm-colors, 'regular') !important;
        caret-color: map.get(colors.$adm-colors, 'regular') !important;
      }
    }
  }
}
</style>
