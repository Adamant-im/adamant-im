<template>
  <td
    :class="{
      [classes.root]: true,
      [classes.ping]: ping,
      [classes.checkbox]: checkbox,
      [classes.alignRight]: align === 'right',
      [classes.alignCenter]: align === 'center'
    }"
  >
    <slot />
  </td>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

const className = 'node-column'
const classes = {
  root: className,
  ping: `${className}--ping`,
  checkbox: `${className}--checkbox`,
  alignRight: `${className}--align-right`,
  alignCenter: `${className}--align-center`
}

export default defineComponent({
  props: {
    /**
     * Indicates that the column is used to display a checkbox component
     */
    checkbox: {
      type: Boolean
    },
    ping: {
      type: Boolean
    },
    align: {
      type: String as PropType<'left' | 'right' | 'center'>
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
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.node-column {
  font-size: 14px;
  padding-left: 0 !important;
  padding-right: 8px !important;

  &--checkbox {
    width: 64px;
    max-width: 64px;
    padding-right: 0 !important;
  }
  &--ping {
    padding-right: 8px !important;
  }

  &--align-right {
    text-align: right;
  }

  &--align-center {
    text-align: center;
  }
}

@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .node-column {
    &--checkbox {
      width: 56px;
      max-width: 56px;
    }
  }
}

.v-theme--light {
  .node-column {
    color: map.get(colors.$adm-colors, 'regular');
  }
}

.v-theme--dark {
  .node-column {
  }
}
</style>
