<template>
  <v-icon
    :icon="node.socketSupport ? mdiCheck : mdiClose"
    :class="node.socketSupport ? classes.supported : classes.unsupported"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import type { NodeStatusResult } from '@/lib/nodes/abstract.node'

import { mdiCheck, mdiClose } from '@mdi/js'


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
      classes,
      mdiCheck,
      mdiClose
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.socket-support {
}

.v-theme--light {
  .socket-support {
    &--supported {
      color: map.get(colors.$adm-colors, 'good') !important;
    }
    &--unsupported {
      color: map.get(colors.$adm-colors, 'danger') !important;
    }
  }
}

.v-theme--dark {
  .socket-support {
    &--supported {
      color: map.get(colors.$adm-colors, 'good') !important;
    }
    &--unsupported {
      color: map.get(colors.$adm-colors, 'danger') !important;
    }
  }
}
</style>
