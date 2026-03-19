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
@use '@/assets/styles/components/_color-roles.scss' as colorRoles;
@use '@/assets/styles/themes/adamant/_mixins.scss';

.node-version {
  @include colorRoles.a-color-role-supporting-var('--a-node-version-color');

  @include mixins.a-text-explanation-small();
  color: var(--a-node-version-color);
}
</style>
