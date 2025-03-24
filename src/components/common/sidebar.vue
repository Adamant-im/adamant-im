<template>
  <div :class="{ [`${className} d-flex justify-center ma-auto`]: true }">
    <aside :class="{
      [`${className}__aside`]: true,
      [`${className}__aside--has-view`]: hasView
    }">
      <slot />
    </aside>
    <div class="d-flex justify-center align-center" :class="{
      [`${className}__router-view`]: true,
    }">
      <img v-show="readyToShow && !hasView" src="/img/adamant-logo-transparent-512x512.png" />

      <router-view v-if="readyToShow" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const className = 'sidebar'

const { readyToShow = true } = defineProps<{
  readyToShow?: boolean
}>()

const route = useRoute()

const hasView = computed(() => {
  return route.matched.length > 1;
})

console.log('route', route)
</script>
<style lang="scss" scoped>
@import 'vuetify/settings';

.sidebar {
  display: flex;
  max-width: 1300px;

  &__aside {
    width: 33%;

    @media #{map-get($display-breakpoints, 'sm-and-down')} {
      width: 100%;
    }

    &--has-view {
      @media #{map-get($display-breakpoints, 'sm-and-down')} {
        display: none;
      }
    }
  }

  &__router-view {
    flex: 1;

    @media #{map-get($display-breakpoints, 'sm-and-down')} {
      img {
        display: none;
      }
    }
  }
}

.v-theme--dark {
  .sidebar {
    &__router-view {
      img {
        filter: invert(1);
      }
    }
  }
}
</style>
