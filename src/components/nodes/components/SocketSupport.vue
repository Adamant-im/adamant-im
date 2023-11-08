<template>
  <v-icon
    :icon="node.socketSupport ? 'mdi-check' : 'mdi-close'"
    :class="node.socketSupport ? classes.supported : classes.unsupported"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import type { NodeStatusResult } from '@/lib/nodes/abstract.node'

const className = 'socket-support'
const classes = {
  supported: `${className}--supported`,
  unsupported: `${className}--unsupported`
}

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    }
  },
  setup() {
    return {
      classes
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
  }
}

.v-theme--dark {
  &--green {
    color: map-get($adm-colors, 'good') !important;
  }
  &--red {
    color: map-get($adm-colors, 'danger') !important;
  }
}
</style>
