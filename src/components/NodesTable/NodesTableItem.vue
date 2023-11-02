<template>
  <tr :class="classes.root">
    <td
      :class="{
        [classes.td]: true,
        [classes.tdCheckbox]: true
      }"
      class="pl-0 pr-0"
    >
      <v-checkbox-btn
        :model-value="active"
        :class="[classes.checkbox, classes.statusIconGrey]"
        @input="toggleActiveStatus"
        :disabled="blockchain !== 'adm'"
      />
    </td>

    <td :class="classes.td" class="pl-0 pr-2">
      {{ url }}
      <blockchain-label v-if="blockchain !== 'adm'" :label="blockchain" />
      <div v-if="version" :class="classes.version">
        {{ 'v' + version }}
      </div>
    </td>

    <td :class="classes.td" class="pl-0 pr-2" :colspan="unsupported ? 2 : 1">
      <div>
        <span>
          {{ nodeStatus }}
        </span>
        <v-icon
          :class="{
            [classes.statusIcon]: true,
            [classes.statusIconGreen]: nodeStatusColor === 'green',
            [classes.statusIconRed]: nodeStatusColor === 'red',
            [classes.statusIconOrange]: nodeStatusColor === 'orange',
            [classes.statusIconGrey]: nodeStatusColor === 'grey'
          }"
          :color="nodeStatusColor"
          icon="mdi-checkbox-blank-circle"
          size="small"
        />
      </div>
      <span v-if="nodeStatusReason" :class="classes.statusSubtitle">{{ nodeStatusReason }}</span>
    </td>

    <td v-if="!unsupported" :class="classes.td" class="pl-0 pr-2">
      <v-icon
        :icon="socketSupport ? 'mdi-check' : 'mdi-close'"
        :class="socketSupport ? classes.statusIconGreen : classes.statusIconRed"
      />
    </td>
  </tr>
</template>

<script lang="ts">
import { computed, PropType } from 'vue'
import { useI18n, type VueI18nTranslation } from 'vue-i18n'
import { useStore } from 'vuex'
import type { NodeStatusResult } from '@/lib/nodes/abstract.node'

import BlockchainLabel from './BlockchainLabel.vue'

function getNodeStatus(node: NodeStatusResult, t: VueI18nTranslation) {
  if (!node.hasMinNodeVersion || !node.hasSupportedProtocol) {
    return t('nodes.unsupported')
  } else if (!node.active) {
    return t('nodes.inactive')
  } else if (!node.online) {
    return t('nodes.offline')
  } else if (node.outOfSync) {
    return t('nodes.sync')
  }

  return node.ping + ' ' + t('nodes.ms')
}

function getNodeStatusReason(node: NodeStatusResult, t: VueI18nTranslation) {
  if (!node.hasMinNodeVersion) {
    return t('nodes.unsupported_reason_api_version')
  } else if (!node.hasSupportedProtocol) {
    return t('nodes.unsupported_reason_protocol')
  }
}

function getNodeStatusColor(node: NodeStatusResult) {
  let color = 'green'

  if (!node.hasMinNodeVersion || !node.hasSupportedProtocol) {
    color = 'red'
  } else if (!node.active) {
    color = 'grey'
  } else if (!node.online) {
    color = 'red'
  } else if (node.outOfSync) {
    color = 'orange'
  }

  return color
}

export default {
  components: { BlockchainLabel },
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    },
    /**
     * Enum: adm | eth | btc | doge | dash | lsk
     */
    blockchain: {
      type: String as PropType<'adm' | 'eth' | 'btc' | 'doge' | 'dash' | 'lsk'>,
      required: true
    }
  },
  setup(props) {
    const { t } = useI18n()
    const store = useStore()

    const className = 'nodes-table-item'
    const classes = {
      root: className,
      td: `${className}__td`,
      checkbox: `${className}__checkbox`,
      version: `${className}__version`,
      statusSubtitle: `${className}__status-subtitle`,
      statusIcon: `${className}__status-icon`,
      statusIconGreen: `${className}__status-icon--green`,
      statusIconRed: `${className}__status-icon--red`,
      statusIconOrange: `${className}__status-icon--orange`,
      statusIconGrey: `${className}__status-icon--grey`,
      tdCheckbox: `${className}__td-checkbox`
    }

    const url = computed(() => props.node.url)
    const version = computed(() => props.node.version)
    const active = computed(() => props.node.active)
    const socketSupport = computed(() => props.node.socketSupport)

    const nodeStatus = computed(() => getNodeStatus(props.node, t))
    const nodeStatusReason = computed(() => getNodeStatusReason(props.node, t))
    const nodeStatusColor = computed(() => getNodeStatusColor(props.node))

    const unsupported = computed(
      () => !props.node.hasMinNodeVersion || !props.node.hasSupportedProtocol || !props.node.online
    )

    const toggleActiveStatus = () => {
      store.dispatch('nodes/toggle', {
        url: url.value,
        active: !active.value
      })
      store.dispatch('nodes/updateStatus')
    }

    return {
      classes,
      url,
      version,
      active,
      socketSupport,
      nodeStatus,
      nodeStatusReason,
      toggleActiveStatus,
      nodeStatusColor,
      unsupported
    }
  }
}
</script>

<style lang="scss">
@import 'vuetify/settings';
@import '../../assets/styles/settings/_colors.scss';
@import '../../assets/styles/themes/adamant/_mixins.scss';

.nodes-table-item {
  &__td {
    font-size: 14px;
  }
  &__version {
    @include a-text-explanation-small();
  }
  &__status-icon {
    margin-inline-start: 4px;
  }
  &__status-subtitle {
    font-size: 12px;
    font-weight: 300;
  }
  &__td-checkbox {
    width: 64px;
    max-width: 64px;
  }
  &__checkbox {
    font-size: 16px;
    margin-left: 16px;
  }
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .nodes-table-item {
    &__td-checkbox {
      width: 56px;
      max-width: 56px;
    }
    &__checkbox {
      margin-left: 8px;
    }
  }
}

.v-theme--light {
  .nodes-table-item {
    &__version {
      color: map-get($adm-colors, 'regular');
    }
    &__td {
      color: map-get($adm-colors, 'regular');
    }
    &__status-subtitle {
      color: map-get($adm-colors, 'regular');
    }
    &__status-icon {
      &--green {
        color: map-get($adm-colors, 'good') !important;
      }
      &--red {
        color: map-get($adm-colors, 'danger') !important;
      }
      &--grey {
        color: map-get($adm-colors, 'grey') !important;
      }
      &--orange {
        color: map-get($adm-colors, 'attention') !important;
      }
    }
  }
}

.v-theme--dark {
  .nodes-table-item {
    &__version {
      opacity: 0.7;
    }
    &__status-subtitle {
      color: map-get($shades, 'white');
      opacity: 0.7;
    }
    &__status-icon {
      &--green {
        color: map-get($adm-colors, 'good') !important;
      }
      &--red {
        color: map-get($adm-colors, 'danger') !important;
      }
      &--grey {
        color: map-get($adm-colors, 'grey') !important;
      }
      &--orange {
        color: map-get($adm-colors, 'attention') !important;
      }
    }
  }
}
</style>
