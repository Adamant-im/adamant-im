<template>
  <v-sheet :class="classes.root">
    <div :class="classes.content">
      <slot />
    </div>

    <v-divider />
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const className = 'nodes-toolbar'
const classes = {
  root: className,
  content: `${className}__content`
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
@import 'src/assets/styles/settings/_colors.scss';

$root: '.nodes-toolbar';

#{$root} {
  &__content {
    display: flex;
    justify-content: flex-end;
    padding: 8px;
  }
}

.v-theme--light {
  #{$root} {
  }
}

.v-theme--dark {
  #{$root} {
    background-color: rgb(var(--v-theme-on-surface-variant));
  }
}
</style>
