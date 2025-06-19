<template>
  <v-table :class="classes.root">
    <slot />
  </v-table>
</template>

<script>
import { defineComponent } from 'vue'

const className = 'nodes-table-container'
const classes = {
  root: className
}

export default defineComponent({
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

.nodes-table-container {
  line-height: 14px;
}

.v-theme--dark {
  .nodes-table-container {
    background-color: map.get(colors.$adm-colors, 'black2');
  }
}
</style>
