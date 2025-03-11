<template>
  <v-list-item>
    <template #prepend>
      <v-list-item-title :class="classes.title">
        <slot name="prepend" />
        {{ title }}
        <slot name="append" />
      </v-list-item-title>
    </template>

    <v-list-item-title v-if="!hidden" :class="classes.value">
      <slot />
    </v-list-item-title>
  </v-list-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const className = 'transaction-list-item'
const classes = {
  root: className,
  title: `${className}__title`,
  value: `${className}__value`
}

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true
    },
    hidden: {
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
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';

.transaction-list-item {
  &__title {
    font-weight: 300;
  }
  &__value {
    font-weight: 300;
    font-size: 14px;
    text-align: right;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    width: 100%;
  }
}

.v-theme--light {
  .transaction-list-item {
    &__title {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__value {
      color: map.get(colors.$adm-colors, 'muted') !important;
    }
  }
}

.v-theme--dark {
  .transaction-list-item {
  }
}
</style>
