<template>
  <v-table :class="classes.root">
    <slot />
  </v-table>
</template>

<script>
import { defineComponent } from 'vue'

const className = 'nodes-table'
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

<style lang="scss">
@import 'vuetify/settings';

.nodes-table {
  margin-left: -24px;
  margin-right: -24px;
  max-width: unset !important;
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .nodes-table {
    margin-left: -16px;
    margin-right: -16px;
  }
}

.v-theme--dark {
  .nodes-table {
    background-color: rgb(var(--v-theme-on-surface-variant));
  }
}
</style>
