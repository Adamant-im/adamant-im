<template>
  <div v-if="version" :class="classes.version">
    {{ 'v' + version }}
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import type { NodeStatusResult } from '@/lib/nodes/abstract.node'

const className = 'node-version'
const classes = {
  version: className
}

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    }
  },
  setup(props) {
    const version = computed(() => props.node.version)

    return {
      version,
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../../assets/styles/themes/adamant/_mixins.scss';

.node-version {
  @include a-text-explanation-small();
}

.v-theme--light {
  .node-version {
    color: map-get($adm-colors, 'regular');
  }
}

.v-theme--dark {
  .node-version {
    opacity: 0.7;
  }
}
</style>
