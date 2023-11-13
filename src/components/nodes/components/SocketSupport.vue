<template>
  <v-icon
    :icon="node.socketSupport ? 'mdi-check' : 'mdi-close'"
    :class="{
      [classes.green]: socketStatus === 'supported',
      [classes.red]: socketStatus === 'unsupported',
      [classes.grey]: socketStatus === 'disabled'
    }"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import type { NodeStatusResult } from '@/lib/nodes/abstract.node'

const className = 'socket-support'
const classes = {
  green: `${className}--green`,
  red: `${className}--red`,
  grey: `${className}--grey`
}

type SocketSupportStatus = 'supported' | 'unsupported' | 'disabled'

function getSocketStatus(node: NodeStatusResult): SocketSupportStatus {
  if (!node.active) {
    return 'disabled'
  }

  return node.socketSupport ? 'supported' : 'unsupported'
}

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    }
  },
  setup(props) {
    const socketStatus = computed(() => getSocketStatus(props.node))

    return {
      classes,
      socketStatus
    }
  }
})
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
@import '../../../assets/styles/settings/_colors.scss';

.socket-support {
}

.v-theme--light {
  .socket-support {
    &--green {
      color: map-get($adm-colors, 'good') !important;
    }
    &--red {
      color: map-get($adm-colors, 'danger') !important;
    }
    &--grey {
      color: map-get($adm-colors, 'grey') !important;
    }
  }
}

.v-theme--dark {
  .socket-support {
    &--green {
      color: map-get($adm-colors, 'good') !important;
    }
    &--red {
      color: map-get($adm-colors, 'danger') !important;
    }
    &--grey {
      color: map-get($adm-colors, 'grey') !important;
    }
  }
}
</style>
