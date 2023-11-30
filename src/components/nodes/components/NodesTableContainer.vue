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
@import 'vuetify/settings';

.nodes-table-container {
}

.v-theme--dark {
  .nodes-table-container {
    background-color: rgb(var(--v-theme-on-surface-variant));
  }
}
</style>
