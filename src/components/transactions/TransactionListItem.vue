<template>
  <v-list-item :class="classes.root">
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
  --a-transaction-list-item-font-size: var(--a-financial-text-font-size);
  --a-transaction-list-item-font-weight: var(--a-financial-text-font-weight);

  &__title {
    font-weight: var(--a-transaction-list-item-font-weight);
  }
  &__value {
    font-weight: var(--a-transaction-list-item-font-weight);
    font-size: var(--a-transaction-list-item-font-size);
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
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
</style>
