<template>
  <v-table :class="classes.root">
    <slot />
  </v-table>
</template>

<script lang="ts" setup>
const className = 'settings-data-table'
const classes = {
  root: className
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';

.settings-data-table {
  --a-settings-data-table-line-height: var(--a-font-size-sm);

  display: block;
  line-height: var(--a-settings-data-table-line-height);
  width: 100%;

  :deep(.v-table__wrapper) {
    width: 100%;
  }

  :deep(table) {
    width: 100%;
  }
}

.v-theme--dark {
  .settings-data-table {
    background-color: map.get(colors.$adm-colors, 'black2');
  }
}
</style>
