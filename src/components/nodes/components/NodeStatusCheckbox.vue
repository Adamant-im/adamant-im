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
  font-size: 16px;
  margin-left: 16px;
}

@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .node-toggle-status-checkbox {
    margin-left: 8px;
  }
}

.v-theme--light {
  .node-toggle-status-checkbox {
    color: map.get(colors.$adm-colors, 'grey') !important;
  }
}

.v-theme--dark {
  .node-toggle-status-checkbox {
    color: map.get(colors.$adm-colors, 'grey') !important;
  }
}
</style>
