<template>
  <td
    :class="{
      [classes.root]: true,
      [classes.checkbox]: checkbox
    }"
  >
    <slot />
  </td>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const className = 'node-column'
const classes = {
  root: className,
  checkbox: `${className}--checkbox`
}

export default defineComponent({
  props: {
    /**
     * Indicates that the column is used to display a checkbox component
     */
    checkbox: {
      type: Boolean
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

.node-column {
  font-size: 14px;
  padding-left: 0 !important;
  padding-right: 8px !important;

  &--checkbox {
    width: 64px;
    max-width: 64px;
    padding-right: 0 !important;
  }
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .node-column {
    &--checkbox {
      width: 56px;
      max-width: 56px;
    }
  }
}

.v-theme--light {
  .node-column {
    color: map-get($adm-colors, 'regular');
  }
}

.v-theme--dark {
  .node-column {
  }
}
</style>
