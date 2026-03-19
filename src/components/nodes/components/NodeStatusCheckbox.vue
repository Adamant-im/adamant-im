<template>
  <v-checkbox-btn
    :class="classes.root"
    :model-value="value"
    @input="$emit('change', value)"
    :disabled="disabled"
  />
</template>
<script lang="ts">
import { defineComponent } from 'vue'

const className = 'node-toggle-status-checkbox'
const classes = {
  root: className
}

export default defineComponent({
  props: {
    disabled: {
      type: Boolean
    },
    value: {
      type: Boolean
    }
  },
  emits: ['change'],
  setup() {
    return {
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.node-toggle-status-checkbox {
  --a-node-toggle-checkbox-font-size: var(--a-font-size-md);
  --a-node-toggle-checkbox-offset-inline-start: var(--a-space-4);
  --a-node-toggle-checkbox-offset-inline-start-mobile: var(--a-space-2);

  font-size: var(--a-node-toggle-checkbox-font-size);
  margin-left: var(--a-node-toggle-checkbox-offset-inline-start);
}

@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .node-toggle-status-checkbox {
    margin-left: var(--a-node-toggle-checkbox-offset-inline-start-mobile);
  }
}

.v-theme--light {
  .node-toggle-status-checkbox {
    color: map.get(colors.$adm-colors, 'grey');
  }
}

.v-theme--dark {
  .node-toggle-status-checkbox {
    color: map.get(colors.$adm-colors, 'grey');
  }
}
</style>
