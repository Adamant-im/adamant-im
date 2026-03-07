<template>
  <div v-if="version" :class="classes.version">
    {{ version }}
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
    const version = computed(() => props.node.displayVersion)

    return {
      version,
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.node-version {
  --a-node-version-color-dark: var(--a-color-text-muted-dark);

  @include mixins.a-text-explanation-small();
}

.v-theme--light {
  .node-version {
    color: map.get(colors.$adm-colors, 'regular');
  }
}

.v-theme--dark {
  .node-version {
    color: var(--a-node-version-color-dark);
  }
}
</style>
