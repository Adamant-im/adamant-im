<template>
  <tr :class="classes.root">
    <td :class="[classes.column, classes.columnCheckbox]" class="pl-0 pr-0">
      <v-checkbox-btn
        :model-value="active"
        :class="classes.checkbox"
        @input="toggleActiveStatus"
        :disabled="blockchain !== 'adm'"
      />
    </td>

    <td :class="classes.column" class="pl-0 pr-2">
      {{ url }}
      <blockchain-label v-if="blockchain !== 'adm'" :label="blockchain" />
      <NodeVersion v-if="node.version" :node="node" />
    </td>

    <td :class="classes.column" class="pl-0 pr-2" :colspan="isUnsupported ? 2 : 1">
      <NodeStatus :node="node" />
    </td>

    <td v-if="!isUnsupported" :class="classes.column" class="pl-0 pr-2">
      <SocketSupport :node="node" />
    </td>
  </tr>
</template>

<script lang="ts">
import { computed, PropType } from 'vue'
import { useStore } from 'vuex'
import type { NodeStatusResult } from '@/lib/nodes/abstract.node'
import type { NodeType } from '@/lib/nodes/types'
import BlockchainLabel from './BlockchainLabel.vue'
import NodeStatus from '@/components/nodes/components/NodeStatus.vue'
import NodeVersion from '@/components/nodes/components/NodeVersion.vue'
import SocketSupport from '@/components/nodes/components/SocketSupport.vue'

export default {
  components: {
    NodeStatus,
    NodeVersion,
    SocketSupport,
    BlockchainLabel
  },
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    },
    blockchain: {
      type: String as PropType<NodeType>,
      required: true
    }
  },
  setup(props) {
    const store = useStore()

    const className = 'nodes-table-item'
    const classes = {
      root: className,
      column: `${className}__column`,
      columnCheckbox: `${className}__column--checkbox`,
      checkbox: `${className}__checkbox`
    }

    const url = computed(() => props.node.url)
    const active = computed(() => props.node.active)
    const socketSupport = computed(() => props.node.socketSupport)
    const isUnsupported = computed(() => props.node.status === 'unsupported_version')

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
      active,
      socketSupport,
      isUnsupported,
      toggleActiveStatus
    }
  }
}
</script>

<style lang="scss">
@import 'vuetify/settings';
@import '../../../../assets/styles/settings/_colors.scss';
@import '../../../../assets/styles/themes/adamant/_mixins.scss';

.nodes-table-item {
  &__column {
    font-size: 14px;

    &--checkbox {
      width: 64px;
      max-width: 64px;
    }
  }
  &__checkbox {
    font-size: 16px;
    margin-left: 16px;
  }
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .nodes-table-item {
    &__column {
      &--checkbox {
        width: 56px;
        max-width: 56px;
      }
    }
    &__checkbox {
      margin-left: 8px;
    }
  }
}

.v-theme--light {
  .nodes-table-item {
    &__column {
      color: map-get($adm-colors, 'regular');
    }
    &__checkbox {
      color: map-get($adm-colors, 'grey') !important;
    }
  }
}

.v-theme--dark {
  .nodes-table-item {
    &__checkbox {
      color: map-get($adm-colors, 'grey') !important;
    }
  }
}
</style>
